// Logger simplificado para evitar problemas de permisos en contenedor
const winston = require('winston');

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

// Solo usar console para logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    })
  ],
  exitOnError: false
});

// Funciones de utilidad para logging estructurado
const loggers = {
  // Logger principal
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),

  // Logger de seguridad (simplificado)
  security: {
    login: (username, ip, success = true, meta = {}) => {
      logger.info(`LOGIN_ATTEMPT: ${username} from ${ip} - ${success ? 'SUCCESS' : 'FAILED'}`, meta);
    },
    
    logout: (username, ip, meta = {}) => {
      logger.info(`LOGOUT: ${username} from ${ip}`, meta);
    },
    
    accessDenied: (username, resource, ip, meta = {}) => {
      logger.warn(`ACCESS_DENIED: ${username} tried to access ${resource} from ${ip}`, meta);
    },
    
    suspiciousActivity: (description, ip, meta = {}) => {
      logger.error(`SUSPICIOUS_ACTIVITY: ${description} from ${ip}`, meta);
    }
  },

  // Logger de LDAP (simplificado)
  ldap: {
    connection: (status, meta = {}) => {
      logger.info(`LDAP_CONNECTION: ${status}`, meta);
    },
    
    operation: (operation, dn, success = true, meta = {}) => {
      logger.info(`LDAP_OPERATION: ${operation} on ${dn} - ${success ? 'SUCCESS' : 'FAILED'}`, meta);
    },
    
    search: (baseDN, filter, resultCount, meta = {}) => {
      logger.info(`LDAP_SEARCH: ${filter} in ${baseDN} - ${resultCount} results`, meta);
    },
    
    error: (operation, error, meta = {}) => {
      logger.error(`LDAP_ERROR: ${operation} - ${error.message || error}`, meta);
    }
  },

  // Logger de auditoría para cambios administrativos (simplificado)
  audit: {
    userCreated: (adminUsername, newUserDN, meta = {}) => {
      logger.info(`USER_CREATED: ${newUserDN} by ${adminUsername}`, meta);
    },
    
    userModified: (adminUsername, userDN, changes, meta = {}) => {
      logger.info(`USER_MODIFIED: ${userDN} by ${adminUsername} - changes: ${JSON.stringify(changes)}`, meta);
    },
    
    userDeleted: (adminUsername, userDN, meta = {}) => {
      logger.warn(`USER_DELETED: ${userDN} by ${adminUsername}`, meta);
    },
    
    groupModified: (adminUsername, groupDN, operation, members, meta = {}) => {
      logger.info(`GROUP_MODIFIED: ${groupDN} by ${adminUsername} - ${operation} - members: ${JSON.stringify(members)}`, meta);
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
    
    logger.info(`HTTP_REQUEST: ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip || req.connection.remoteAddress} - ${req.session?.user?.username || 'anonymous'}`);
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = loggers;