const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const validator = require('validator');
const config = require('../../config');
const logger = require('../services/logger-simple');

class SecurityMiddleware {
  // Middleware para sanitizar entrada del usuario
  static sanitizeInput(req, res, next) {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = SecurityMiddleware.sanitizeObject(req.body);
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = SecurityMiddleware.sanitizeObject(req.query);
    }

    // Sanitizar parámetros de ruta
    if (req.params && typeof req.params === 'object') {
      req.params = SecurityMiddleware.sanitizeObject(req.params);
    }

    next();
  }

  // Función auxiliar para sanitizar objetos recursivamente
  static sanitizeObject(obj) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Sanitizar HTML y caracteres peligrosos
        sanitized[key] = sanitizeHtml(value, {
          allowedTags: [], // No permitir tags HTML
          allowedAttributes: {},
          disallowedTagsMode: 'discard'
        }).trim();
        
        // Validar longitud máxima
        if (sanitized[key].length > 10000) {
          sanitized[key] = sanitized[key].substring(0, 10000);
        }
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = SecurityMiddleware.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Headers de seguridad adicionales
  static addSecurityHeaders(req, res, next) {
    // Prevenir clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevenir MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Habilitar XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Feature policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
  }

  // Rate limiting específico para login
  static createLoginRateLimit() {
    const loginConfig = config.server.env === 'production' 
      ? config.security.loginRateLimit 
      : config.development.loginRateLimit || config.security.loginRateLimit;
      
    return rateLimit({
      windowMs: loginConfig.windowMs,
      max: loginConfig.max,
      message: {
        error: 'Demasiados intentos de login',
        message: loginConfig.message,
        retryAfter: Math.ceil(loginConfig.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        const ip = req.ip || req.connection.remoteAddress;
        logger.security.suspiciousActivity(
          'Rate limit exceeded for login attempts',
          ip,
          { 
            userAgent: req.get('User-Agent'),
            attempt: req.body?.username 
          }
        );
        
        const loginConfig = config.server.env === 'production' 
          ? config.security.loginRateLimit 
          : config.development.loginRateLimit || config.security.loginRateLimit;
        
        res.status(429).json({
          error: 'Demasiados intentos de login',
          message: 'Ha excedido el límite de intentos de login. Intente más tarde.',
          retryAfter: Math.ceil(loginConfig.windowMs / 1000)
        });
      }
    });
  }

  // Rate limiting para API
  static createAPIRateLimit() {
    return rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 60, // 60 requests por minuto
      message: {
        error: 'Demasiadas solicitudes',
        message: 'Ha excedido el límite de solicitudes para la API'
      },
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  // Validar entrada de usuario común
  static validateUserInput(req, res, next) {
    const errors = [];

    // Validar email si está presente
    if (req.body.email && !validator.isEmail(req.body.email)) {
      errors.push('Email inválido');
    }

    // Validar username
    if (req.body.username) {
      if (!validator.isAlphanumeric(req.body.username.replace(/[._-]/g, ''))) {
        errors.push('El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos');
      }
      if (!validator.isLength(req.body.username, { min: 3, max: 50 })) {
        errors.push('El nombre de usuario debe tener entre 3 y 50 caracteres');
      }
    }

    // Validar contraseña
    if (req.body.password) {
      if (!validator.isLength(req.body.password, { min: 8 })) {
        errors.push('La contraseña debe tener al menos 8 caracteres');
      }
      // Opcional: validar complejidad de contraseña
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(req.body.password)) {
        errors.push('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número');
      }
    }

    // Validar DN LDAP
    if (req.body.dn || req.params.dn) {
      const dn = req.body.dn || req.params.dn;
      if (!SecurityMiddleware.isValidLDAPDN(dn)) {
        errors.push('DN LDAP inválido');
      }
    }

    if (errors.length > 0) {
      logger.warn('Validación de entrada fallida', { 
        errors, 
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        user: req.session?.user?.username
      });

      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        details: errors
      });
    }

    next();
  }

  // Validar DN LDAP
  static isValidLDAPDN(dn) {
    if (!dn || typeof dn !== 'string') return false;
    
    // Patrón básico para DN LDAP
    const dnPattern = /^([a-zA-Z]+=.+)(,\s*[a-zA-Z]+=.+)*$/;
    
    // Verificar longitud razonable
    if (dn.length > 500) return false;
    
    // Verificar patrón
    if (!dnPattern.test(dn)) return false;
    
    // Verificar que no contenga caracteres peligrosos
    const dangerousChars = ['<', '>', '"', '\'', '&', '\0', '\n', '\r'];
    return !dangerousChars.some(char => dn.includes(char));
  }

  // Middleware para validar CSRF token (si está habilitado)
  static validateCSRF(req, res, next) {
    // Solo validar CSRF para métodos que modifican datos
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const token = req.body._csrf || req.headers['x-csrf-token'];
      
      if (!token) {
        logger.security.suspiciousActivity(
          'Missing CSRF token',
          req.ip || req.connection.remoteAddress,
          { 
            method: req.method,
            url: req.originalUrl,
            user: req.session?.user?.username
          }
        );
        
        return res.status(403).json({
          error: 'Token CSRF requerido',
          message: 'Solicitud inválida: falta token CSRF'
        });
      }
    }
    
    next();
  }

  // Middleware para logging de actividades sospechosas
  static detectSuspiciousActivity(req, res, next) {
    const suspicious = [];
    
    // Detectar caracteres sospechosos en URLs
    if (req.originalUrl.includes('<script') || req.originalUrl.includes('javascript:')) {
      suspicious.push('XSS attempt in URL');
    }
    
    // Detectar intentos de inyección SQL
    const sqlPatterns = ['union select', 'drop table', '1=1', 'or 1=1'];
    const bodyStr = JSON.stringify(req.body || {}).toLowerCase();
    
    for (const pattern of sqlPatterns) {
      if (bodyStr.includes(pattern)) {
        suspicious.push('SQL injection attempt');
        break;
      }
    }
    
    // Detectar user agents sospechosos
    const userAgent = req.get('User-Agent') || '';
    const suspiciousAgents = ['sqlmap', 'nikto', 'nmap', 'masscan'];
    
    for (const agent of suspiciousAgents) {
      if (userAgent.toLowerCase().includes(agent)) {
        suspicious.push('Suspicious user agent');
        break;
      }
    }
    
    // Log actividades sospechosas
    if (suspicious.length > 0) {
      logger.security.suspiciousActivity(
        suspicious.join(', '),
        req.ip || req.connection.remoteAddress,
        {
          userAgent,
          url: req.originalUrl,
          method: req.method,
          body: req.body,
          user: req.session?.user?.username
        }
      );
      
      // En producción, podríamos bloquear la request aquí
      if (config.server.env === 'production') {
        return res.status(403).json({
          error: 'Actividad sospechosa detectada',
          message: 'Su solicitud ha sido bloqueada por razones de seguridad'
        });
      }
    }
    
    next();
  }

  // Middleware para prevenir ataques de timing
  static addRandomDelay(min = 100, max = 300) {
    return (req, res, next) => {
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      setTimeout(next, delay);
    };
  }

  // Middleware para validar content-type
  static validateContentType(req, res, next) {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      
      if (!contentType || (!contentType.includes('application/json') && 
                          !contentType.includes('application/x-www-form-urlencoded') &&
                          !contentType.includes('multipart/form-data'))) {
        return res.status(400).json({
          error: 'Content-Type inválido',
          message: 'Content-Type debe ser application/json o application/x-www-form-urlencoded'
        });
      }
    }
    
    next();
  }
}

module.exports = SecurityMiddleware;