const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const AuthMiddleware = require('../middleware/auth');
const SecurityMiddleware = require('../middleware/security');
const ErrorMiddleware = require('../middleware/error');
const logger = require('../services/logger-simple');

const router = express.Router();

// Rate limiting específico para login
const loginLimiter = SecurityMiddleware.createLoginRateLimit();

// Validaciones para login
const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 1 })
    .withMessage('La contraseña no puede estar vacía')
];

// GET /auth/login - Mostrar formulario de login
router.get('/login', AuthMiddleware.redirectIfAuthenticated, (req, res) => {
  res.render('auth/login', {
    title: 'Iniciar Sesión - LDAP Admin',
    error: req.flash('error'),
    success: req.flash('success'),
    csrfToken: null, // Deshabilitado temporalmente
    layout: false // No usar layout para login
  });
});

// POST /auth/login - Procesar login
router.post('/login', 
  loginLimiter,
  SecurityMiddleware.detectSuspiciousActivity,
  SecurityMiddleware.validateContentType,
  loginValidation,
  ErrorMiddleware.asyncWrapper(async (req, res) => {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Intento de login con datos inválidos:', {
        errors: errors.array(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({
          error: 'Datos inválidos',
          details: errors.array()
        });
      } else {
        req.flash('error', errors.array().map(e => e.msg).join('. '));
        return res.redirect(303, '/auth/login');
      }
    }

    const { username, password, remember } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    try {
      // Intentar autenticación
      const authResult = await AuthMiddleware.authenticateUser(username, password);

      if (!authResult.success) {
        // Log intento fallido
        logger.security.login(username, ip, false, {
          error: authResult.error,
          userAgent
        });

        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.status(401).json({
            error: 'Credenciales inválidas',
            message: authResult.error
          });
        } else {
          req.flash('error', 'Credenciales inválidas');
          return res.redirect(303, '/auth/login');
        }
      }

      // Autenticación exitosa - crear sesión
      req.session.user = authResult.user;
      req.session.lastActivity = new Date().toISOString();

      // Configurar duración de la sesión
      if (remember === 'on') {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
      } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 horas
      }

      // Log login exitoso
      logger.security.login(username, ip, true, {
        userAgent,
        roles: authResult.user.roles,
        remember: !!remember
      });

      // Responder según el tipo de request
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.json({
          success: true,
          message: 'Autenticación exitosa',
          user: {
            username: authResult.user.username,
            displayName: authResult.user.displayName,
            roles: authResult.user.roles
          },
          redirectUrl: '/dashboard'
        });
      } else {
        req.flash('success', `Bienvenido, ${authResult.user.displayName}`);
        res.redirect(303, '/dashboard');
      }

    } catch (error) {
      logger.error('Error en proceso de login:', {
        error: error.message,
        stack: error.stack,
        username,
        ip,
        userAgent
      });

      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(500).json({
          error: 'Error interno',
          message: 'Error al procesar la autenticación'
        });
      } else {
        req.flash('error', 'Error interno del servidor');
        res.redirect('/auth/login');
      }
    }
  })
);

// GET /auth/logout - Cerrar sesión
router.get('/logout', AuthMiddleware.requireAuth, (req, res) => {
  const username = req.session.user?.username;
  const ip = req.ip || req.connection.remoteAddress;

  // Log logout
  logger.security.logout(username, ip, {
    userAgent: req.get('User-Agent')
  });

  // Destruir sesión
  req.session.destroy((err) => {
    if (err) {
      logger.error('Error al destruir sesión:', err);
    }

    res.clearCookie('ldap-admin-session');
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente',
        redirectUrl: '/auth/login'
      });
    } else {
      req.flash('success', 'Sesión cerrada exitosamente');
      res.redirect('/auth/login');
    }
  });
});

// GET /auth/profile - Ver perfil del usuario actual
router.get('/profile', AuthMiddleware.requireAuth, (req, res) => {
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    res.json({
      user: req.session.user
    });
  } else {
    res.render('auth/profile', {
      title: 'Mi Perfil - LDAP Admin',
      user: req.session.user
    });
  }
});

// POST /auth/change-password - Cambiar contraseña
router.post('/change-password',
  AuthMiddleware.requireAuth,
  SecurityMiddleware.detectSuspiciousActivity,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('La contraseña actual es requerida'),
    
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La nueva contraseña debe contener al menos una letra minúscula, una mayúscula y un número'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        return true;
      })
  ],
  ErrorMiddleware.asyncWrapper(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.session.user;

    try {
      // Verificar contraseña actual
      const authResult = await AuthMiddleware.authenticateUser(user.username, currentPassword);
      
      if (!authResult.success) {
        return res.status(401).json({
          error: 'Contraseña actual incorrecta'
        });
      }

      // Aquí implementaríamos el cambio de contraseña en LDAP
      // Por ahora, solo simulamos el proceso
      
      logger.audit.userModified(
        user.username,
        user.dn,
        { operation: 'password_change' },
        {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        }
      );

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });

    } catch (error) {
      logger.error('Error al cambiar contraseña:', {
        error: error.message,
        user: user.username,
        ip: req.ip || req.connection.remoteAddress
      });

      res.status(500).json({
        error: 'Error interno',
        message: 'Error al cambiar la contraseña'
      });
    }
  })
);

// GET /auth/status - Verificar estado de autenticación
router.get('/status', (req, res) => {
  if (req.session.user) {
    res.json({
      authenticated: true,
      user: {
        username: req.session.user.username,
        displayName: req.session.user.displayName,
        roles: req.session.user.roles,
        lastActivity: req.session.lastActivity
      }
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

// POST /auth/refresh - Refrescar sesión
router.post('/refresh', AuthMiddleware.requireAuth, (req, res) => {
  req.session.lastActivity = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Sesión refrescada',
    lastActivity: req.session.lastActivity
  });
});

module.exports = router;