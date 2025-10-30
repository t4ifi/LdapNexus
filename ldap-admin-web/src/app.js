const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');

// Importar configuración y servicios
const config = require('../config');
const logger = require('./services/logger-simple');
const ldapService = require('./services/ldapService');

// Importar middleware personalizado
const authMiddleware = require('./middleware/auth');
const errorMiddleware = require('./middleware/error');
const securityMiddleware = require('./middleware/security');

// Importar rutas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const apiRoutes = require('./routes/api');
const educationRoutes = require('./routes/education');

class LDAPAdminApp {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Middleware de seguridad básica - usar configuración específica del entorno
    const helmetConfig = config.server.env === 'production' 
      ? config.security.helmet 
      : config.development.helmet || config.security.helmet;
    this.app.use(helmet(helmetConfig));
    
    // Compresión
    this.app.use(compression());
    
    // CORS
    const corsOptions = config.server.env === 'production' 
      ? config.production.cors 
      : config.development.cors;
    this.app.use(cors(corsOptions));
    
    // Rate limiting global - usar configuración específica del entorno
    const rateLimitConfig = config.server.env === 'production' 
      ? config.security.rateLimit 
      : config.development.rateLimit || config.security.rateLimit;
    const limiter = rateLimit(rateLimitConfig);
    this.app.use(limiter);
    
    // Parsing del cuerpo de la request
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());
    
    // Logging de requests
    if (config.server.env !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim())
        }
      }));
    }
    
    // Configuración de sesiones
    this.app.use(session({
      ...config.session,
      store: this.getSessionStore()
    }));
    
    // Flash messages
    this.app.use(flash());
    
    // Motor de plantillas
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '../views'));
    
    // Configurar express-ejs-layouts
    this.app.use(expressLayouts);
    this.app.set('layout', 'layout');
    this.app.set('layout extractScripts', true);
    this.app.set('layout extractStyles', true);
    
    // Archivos estáticos
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Middleware personalizado de seguridad
    this.app.use(securityMiddleware.sanitizeInput);
    this.app.use(securityMiddleware.addSecurityHeaders);
    
    // Variables globales para templates
    this.app.use((req, res, next) => {
      res.locals.user = req.session.user || null;
      res.locals.isAuthenticated = !!req.session.user;
      res.locals.appName = config.app.name;
      res.locals.appVersion = config.app.version;
      res.locals.currentPath = req.path;
      next();
    });
  }

  getSessionStore() {
    // En producción, usar Redis para sesiones distribuidas
    if (config.redis.enabled && config.server.env === 'production') {
      const RedisStore = require('connect-redis')(session);
      const redis = require('redis');
      const client = redis.createClient(config.redis);
      
      client.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });
      
      return new RedisStore({ client });
    }
    
    // En desarrollo, usar sesiones en memoria
    return undefined;
  }

  setupRoutes() {
    // Página de inicio - redirigir a login o dashboard
    this.app.get('/', (req, res) => {
      if (req.session.user) {
        res.redirect('/dashboard');
      } else {
        res.redirect('/auth/login');
      }
    });
    
    // Rutas de autenticación
    this.app.use('/auth', authRoutes);
    
    // Rutas protegidas
    this.app.use('/dashboard', authMiddleware.requireAuth, dashboardRoutes);
    this.app.use('/api/v1', authMiddleware.requireAuth, apiRoutes);
    this.app.use('/education', authMiddleware.requireAuth, educationRoutes);
    
    // Ruta de salud del sistema
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: config.app.version,
        environment: config.server.env
      });
    });
    
    // Ruta para información del sistema
    this.app.get('/info', authMiddleware.requireAuth, (req, res) => {
      res.json({
        app: {
          name: config.app.name,
          version: config.app.version,
          description: config.app.description
        },
        ldap: {
          url: config.ldap.url.replace(/\/\/.*@/, '//***:***@'), // Ocultar credenciales
          baseDN: config.ldap.baseDN,
          userBaseDN: config.ldap.userBaseDN,
          groupBaseDN: config.ldap.groupBaseDN
        },
        features: {
          education: config.education.enabled,
          tutorials: config.education.features.tutorial,
          examples: config.education.features.examples
        }
      });
    });
    
    // Manejo de rutas no encontradas
    this.app.use('*', (req, res) => {
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(404).json({
          error: 'Endpoint no encontrado',
          message: `La ruta ${req.originalUrl} no existe`
        });
      } else {
        res.status(404).render('error', {
          title: 'Página no encontrada',
          message: 'La página que busca no existe',
          error: {
            status: 404,
            stack: config.server.env === 'development' ? 'Ruta no encontrada' : ''
          }
        });
      }
    });
  }

  setupErrorHandling() {
    // Middleware de manejo de errores
    this.app.use(errorMiddleware.logErrors);
    this.app.use(errorMiddleware.clientErrorHandler);
    this.app.use(errorMiddleware.errorHandler);
  }

  async start() {
    try {
      // Verificar conexión LDAP antes de iniciar
      await this.checkLDAPConnection();
      
      // Iniciar servidor
      const server = this.app.listen(config.server.port, config.server.host, () => {
        logger.info(`🚀 ${config.app.name} iniciado`);
        logger.info(`📡 Servidor corriendo en http://${config.server.host}:${config.server.port}`);
        logger.info(`🔧 Entorno: ${config.server.env}`);
        logger.info(`📁 LDAP Server: ${config.ldap.url}`);
        logger.info(`📚 Características educativas: ${config.education.enabled ? 'Habilitadas' : 'Deshabilitadas'}`);
      });

      // Manejo graceful de cierre
      this.setupGracefulShutdown(server);
      
      return server;
    } catch (error) {
      logger.error('Error al iniciar la aplicación:', error);
      process.exit(1);
    }
  }

  async checkLDAPConnection() {
    try {
      logger.info('🔍 Verificando conexión LDAP...');
      await ldapService.testConnection();
      logger.info('✅ Conexión LDAP establecida correctamente');
    } catch (error) {
      logger.error('❌ Error de conexión LDAP:', error.message);
      logger.warn('⚠️  La aplicación iniciará, pero algunas funciones pueden no estar disponibles');
    }
  }

  setupGracefulShutdown(server) {
    process.on('SIGTERM', () => {
      logger.info('📴 Recibida señal SIGTERM, cerrando servidor...');
      server.close(() => {
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('📴 Recibida señal SIGINT (Ctrl+C), cerrando servidor...');
      server.close(() => {
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('uncaughtException', (error) => {
      logger.error('💥 Excepción no capturada:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Promise rechazada no manejada:', reason);
      process.exit(1);
    });
  }
}

// Crear y exportar la instancia de la aplicación
const app = new LDAPAdminApp();

module.exports = app;

// Si este archivo se ejecuta directamente, iniciar el servidor
if (require.main === module) {
  app.start();
}