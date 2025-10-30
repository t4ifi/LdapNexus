// Configuración principal de la aplicación LDAP Admin Web
module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // Configuración LDAP
  ldap: {
    url: process.env.LDAP_URL || 'ldap://openldap:389',
    baseDN: process.env.LDAP_BASE_DN || 'dc=ejemplo,dc=com',
    adminDN: process.env.LDAP_ADMIN_DN || 'cn=admin,dc=ejemplo,dc=com',
    adminPassword: process.env.LDAP_ADMIN_PASSWORD || 'admin123',
    userBaseDN: process.env.LDAP_USER_BASE_DN || 'ou=people,dc=ejemplo,dc=com',
    groupBaseDN: process.env.LDAP_GROUP_BASE_DN || 'ou=groups,dc=ejemplo,dc=com',
    userObjectClass: 'inetOrgPerson',
    groupObjectClass: 'groupOfNames',
    usernameAttribute: 'cn',
    emailAttribute: 'mail',
    timeout: 5000,
    reconnect: true
  },

  // Configuración de sesiones
  session: {
    secret: process.env.SESSION_SECRET || 'ldap-admin-secret-key-change-in-production',
    name: 'ldap-admin-session',
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS en producción
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: 'strict'
    },
    resave: false,
    saveUninitialized: false
  },

  // Configuración de Redis (opcional para sesiones distribuidas)
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0
  },

  // Configuración de seguridad
  security: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // máximo 100 requests por ventana
      message: 'Demasiadas solicitudes, intente más tarde'
    },
    
    // Rate limiting para login
    loginRateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 5, // máximo 5 intentos de login por ventana
      message: 'Demasiados intentos de login, intente más tarde'
    },

    // Configuración CSRF
    csrf: {
      enabled: true,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    },

    // Headers de seguridad
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: process.env.FILE_LOGGING_ENABLED === 'true',
      filename: 'ldap-admin-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    },
    console: {
      enabled: true  // Siempre habilitado para desarrollo y contenedor
    }
  },

  // Configuración de la aplicación
  app: {
    name: 'LDAP Admin Web',
    version: '1.0.0',
    description: 'Interfaz web segura para administración y aprendizaje de LDAP',
    author: 'LDAP Admin Team',
    
    // Configuración de paginación
    pagination: {
      defaultLimit: 10,
      maxLimit: 100
    },

    // Configuración de uploads (si se necesita)
    upload: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'text/plain']
    },

    // URLs y paths
    urls: {
      login: '/auth/login',
      logout: '/auth/logout',
      dashboard: '/dashboard',
      api: '/api/v1'
    }
  },

  // Configuración específica por entorno
  development: {
    debug: true,
    verbose: true,
    cors: {
      origin: true,
      credentials: true
    },
    // Rate limiting más permisivo para desarrollo
    rateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 1000, // máximo 1000 requests por ventana
      message: 'Demasiadas solicitudes, intente más tarde'
    },
    
    loginRateLimit: {
      windowMs: 1 * 60 * 1000, // 1 minuto
      max: 50, // máximo 50 intentos de login por ventana
      message: 'Demasiados intentos de login, intente más tarde'
    },
    // CSP más permisivo para desarrollo
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: []
        }
      }
    }
  },

  production: {
    debug: false,
    verbose: false,
    cors: {
      origin: false, // Configurar dominios específicos
      credentials: true
    },
    // Configuraciones adicionales de producción
    cluster: {
      enabled: true,
      workers: process.env.CLUSTER_WORKERS || 'auto'
    }
  },

  // Configuración de la base de conocimiento educativa
  education: {
    enabled: true,
    features: {
      tutorial: true,
      examples: true,
      playground: true,
      documentation: true
    }
  }
};