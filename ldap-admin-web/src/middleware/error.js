const logger = require('../services/logger-simple');
const config = require('../../config');

class ErrorMiddleware {
  // Middleware para logging de errores
  static logErrors(err, req, res, next) {
    // Log del error con contexto completo
    logger.error('Error en aplicación:', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      user: req.session?.user?.username || 'anonymous',
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query
    });

    next(err);
  }

  // Middleware para manejar errores de cliente (4xx)
  static clientErrorHandler(err, req, res, next) {
    // Manejar errores específicos del cliente
    if (err.status && err.status >= 400 && err.status < 500) {
      const errorResponse = {
        error: err.message || 'Error del cliente',
        status: err.status
      };

      // Agregar detalles en desarrollo
      if (config.server.env === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = err.details;
      }

      return res.status(err.status).json(errorResponse);
    }

    next(err);
  }

  // Middleware principal de manejo de errores
  static errorHandler(err, req, res, next) {
    // Status code por defecto
    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || 'Error interno del servidor';
    let details = null;

    // Manejar errores específicos
    switch (err.name) {
      case 'ValidationError':
        statusCode = 400;
        message = 'Datos de entrada inválidos';
        details = ErrorMiddleware.formatValidationErrors(err);
        break;

      case 'CastError':
        statusCode = 400;
        message = 'Formato de datos inválido';
        break;

      case 'JsonWebTokenError':
        statusCode = 401;
        message = 'Token inválido';
        break;

      case 'TokenExpiredError':
        statusCode = 401;
        message = 'Token expirado';
        break;

      case 'MulterError':
        statusCode = 400;
        message = ErrorMiddleware.formatMulterError(err);
        break;

      case 'MongoError':
      case 'MongooseError':
        statusCode = 500;
        message = 'Error de base de datos';
        break;

      case 'LDAPError':
        statusCode = ErrorMiddleware.mapLDAPErrorStatus(err);
        message = ErrorMiddleware.formatLDAPError(err);
        break;

      default:
        // Manejar errores HTTP estándar
        if (err.code) {
          switch (err.code) {
            case 'ENOTFOUND':
              statusCode = 502;
              message = 'Servicio no disponible';
              break;
            case 'ECONNREFUSED':
              statusCode = 502;
              message = 'Conexión rechazada';
              break;
            case 'ETIMEDOUT':
              statusCode = 504;
              message = 'Tiempo de espera agotado';
              break;
          }
        }
    }

    // Crear respuesta de error
    const errorResponse = {
      error: message,
      status: statusCode,
      timestamp: new Date().toISOString()
    };

    // Agregar detalles en desarrollo
    if (config.server.env === 'development') {
      errorResponse.stack = err.stack;
      errorResponse.originalError = err.message;
      if (details) {
        errorResponse.details = details;
      }
    }

    // Log específico para errores 5xx
    if (statusCode >= 500) {
      logger.error('Error interno del servidor:', {
        error: err.message,
        stack: err.stack,
        statusCode,
        url: req.originalUrl,
        method: req.method,
        user: req.session?.user?.username
      });
    }

    // Responder según el tipo de request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // Request AJAX/API - responder con JSON
      res.status(statusCode).json(errorResponse);
    } else {
      // Request de página web - renderizar página de error
      res.status(statusCode).render('error', {
        title: `Error ${statusCode}`,
        message,
        error: {
          status: statusCode,
          stack: config.server.env === 'development' ? err.stack : ''
        }
      });
    }
  }

  // Formatear errores de validación
  static formatValidationErrors(err) {
    const errors = [];
    
    if (err.errors) {
      for (const field in err.errors) {
        errors.push({
          field,
          message: err.errors[field].message
        });
      }
    }
    
    return errors;
  }

  // Formatear errores de Multer (upload de archivos)
  static formatMulterError(err) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return 'El archivo es demasiado grande';
      case 'LIMIT_FILE_COUNT':
        return 'Demasiados archivos';
      case 'LIMIT_UNEXPECTED_FILE':
        return 'Campo de archivo inesperado';
      default:
        return 'Error al procesar archivo';
    }
  }

  // Mapear errores LDAP a códigos HTTP
  static mapLDAPErrorStatus(err) {
    const ldapCode = err.code || 0;
    
    switch (ldapCode) {
      case 49: // Invalid credentials
        return 401;
      case 50: // Insufficient access rights
        return 403;
      case 32: // No such object
        return 404;
      case 68: // Already exists
        return 409;
      case 53: // Unwilling to perform
        return 400;
      default:
        return 500;
    }
  }

  // Formatear errores LDAP
  static formatLDAPError(err) {
    const ldapCode = err.code || 0;
    
    switch (ldapCode) {
      case 49:
        return 'Credenciales inválidas';
      case 50:
        return 'Permisos insuficientes';
      case 32:
        return 'Objeto no encontrado';
      case 68:
        return 'El objeto ya existe';
      case 53:
        return 'Operación no permitida';
      case 1:
        return 'Error de operación LDAP';
      case 81:
        return 'Error de conexión al servidor LDAP';
      default:
        return err.message || 'Error de LDAP';
    }
  }

  // Wrapper para async routes
  static asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Middleware para manejar 404
  static notFoundHandler(req, res, next) {
    const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
    error.status = 404;
    next(error);
  }

  // Crear error personalizado
  static createError(message, status = 500, details = null) {
    const error = new Error(message);
    error.status = status;
    if (details) {
      error.details = details;
    }
    return error;
  }

  // Manejar errores de parsing JSON
  static jsonErrorHandler(err, req, res, next) {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      logger.warn('Error de parsing JSON:', {
        error: err.message,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress
      });

      return res.status(400).json({
        error: 'JSON inválido',
        message: 'El cuerpo de la solicitud contiene JSON malformado'
      });
    }
    
    next(err);
  }

  // Manejar errores de CSRF
  static csrfErrorHandler(err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN') {
      logger.security.suspiciousActivity(
        'Invalid CSRF token',
        req.ip || req.connection.remoteAddress,
        {
          url: req.originalUrl,
          method: req.method,
          user: req.session?.user?.username
        }
      );

      return res.status(403).json({
        error: 'Token CSRF inválido',
        message: 'La solicitud no contiene un token CSRF válido'
      });
    }
    
    next(err);
  }

  // Middleware para tiempo de respuesta
  static responseTimeHandler(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      // Log requests lentas
      if (duration > 5000) { // 5 segundos
        logger.warn('Request lenta detectada:', {
          duration: `${duration}ms`,
          url: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          user: req.session?.user?.username
        });
      }
      
      // Agregar header de tiempo de respuesta
      res.set('X-Response-Time', `${duration}ms`);
    });
    
    next();
  }
}

module.exports = ErrorMiddleware;