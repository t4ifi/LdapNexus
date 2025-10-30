const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../../config');

// Crear directorio de logs si no existe (solo en desarrollo)
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  // Si no se puede crear el directorio, usar solo console logging
  console.warn('No se pudo crear directorio de logs, usando solo console logging:', error.message);
}

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Agregar stack trace si existe
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Configurar transports
const transports = [];

// Transport para consola (desarrollo)
if (config.logging.console.enabled) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    })
  );
}

// Transport para archivos (producción) - solo si el directorio existe
if (config.logging.file.enabled && fs.existsSync(logsDir)) {
  try {
    // Logs generales con rotación diaria
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, config.logging.file.filename),
        datePattern: config.logging.file.datePattern,
        maxSize: config.logging.file.maxSize,
        maxFiles: config.logging.file.maxFiles,
        format: customFormat
      })
    );
    
    // Logs de error separados
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: customFormat
      })
    );
  } catch (error) {
    console.warn('No se pudieron configurar los logs de archivo:', error.message);
  }
}

// Crear logger principal
const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  // No salir en errores
  exitOnError: false
});

// Logger específico para eventos de seguridad
const securityTransports = [];
if (fs.existsSync(logsDir)) {
  try {
    securityTransports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'security-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d'
      })
    );
  } catch (error) {
    console.warn('No se pudo configurar security logger:', error.message);
  }
}
if (securityTransports.length === 0) {
  securityTransports.push(new winston.transports.Console());
}

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: securityTransports
});

// Logger específico para eventos LDAP
const ldapTransports = [];
if (fs.existsSync(logsDir)) {
  try {
    ldapTransports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'ldap-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d'
      })
    );
  } catch (error) {
    console.warn('No se pudo configurar LDAP logger:', error.message);
  }
}
if (ldapTransports.length === 0) {
  ldapTransports.push(new winston.transports.Console());
}

const ldapLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: ldapTransports
});

// Funciones de utilidad para logging estructurado
const loggers = {
  // Logger principal
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Logger de seguridad
  security: {
    login: (username, ip, success = true, meta = {}) => {
      securityLogger.info('LOGIN_ATTEMPT', {
        username,
        ip,
        success,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    logout: (username, ip, meta = {}) => {
      securityLogger.info('LOGOUT', {
        username,
        ip,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    accessDenied: (username, resource, ip, meta = {}) => {
      securityLogger.warn('ACCESS_DENIED', {
        username,
        resource,
        ip,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    suspiciousActivity: (description, ip, meta = {}) => {
      securityLogger.error('SUSPICIOUS_ACTIVITY', {
        description,
        ip,
        timestamp: new Date().toISOString(),
        ...meta
      });
    }
  },

  // Logger de LDAP
  ldap: {
    connection: (status, meta = {}) => {
      ldapLogger.info('LDAP_CONNECTION', {
        status,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    operation: (operation, dn, success = true, meta = {}) => {
      ldapLogger.info('LDAP_OPERATION', {
        operation,
        dn,
        success,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    search: (baseDN, filter, resultCount, meta = {}) => {
      ldapLogger.info('LDAP_SEARCH', {
        baseDN,
        filter,
        resultCount,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    error: (operation, error, meta = {}) => {
      ldapLogger.error('LDAP_ERROR', {
        operation,
        error: error.message || error,
        timestamp: new Date().toISOString(),
        ...meta
      });
    }
  },

  // Logger de auditoría para cambios administrativos
  audit: {
    userCreated: (adminUsername, newUserDN, meta = {}) => {
      securityLogger.info('USER_CREATED', {
        admin: adminUsername,
        newUser: newUserDN,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    userModified: (adminUsername, userDN, changes, meta = {}) => {
      securityLogger.info('USER_MODIFIED', {
        admin: adminUsername,
        user: userDN,
        changes,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    userDeleted: (adminUsername, userDN, meta = {}) => {
      securityLogger.warn('USER_DELETED', {
        admin: adminUsername,
        deletedUser: userDN,
        timestamp: new Date().toISOString(),
        ...meta
      });
    },
    
    groupModified: (adminUsername, groupDN, operation, members, meta = {}) => {
      securityLogger.info('GROUP_MODIFIED', {
        admin: adminUsername,
        group: groupDN,
        operation,
        members,
        timestamp: new Date().toISOString(),
        ...meta
      });
    }
  }
};

// Función para crear un logger hijo con contexto específico
loggers.child = (context) => {
  return {
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta })
  };
};

// Middleware para logging de requests HTTP
loggers.requestLogger = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    
    logger.info('HTTP_REQUEST', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      user: req.session?.user?.username || 'anonymous'
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = loggers;