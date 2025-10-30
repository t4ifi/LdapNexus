const express = require('express');
const ErrorMiddleware = require('../middleware/error');
const ldapService = require('../services/ldapService');
const logger = require('../services/logger-simple');

const router = express.Router();

// GET /dashboard - Panel principal
router.get('/', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    // Obtener estadísticas del directorio LDAP
    const stats = await ldapService.getDirectoryStats();
    
    // Obtener usuarios recientes (opcional)
    const allRecentUsers = await ldapService.searchUsers('(objectClass=inetOrgPerson)', ['cn', 'displayName', 'mail'], 5);
    const recentUsers = allRecentUsers.filter(user => user && user.cn);
    
    res.render('dashboard/index', {
      title: 'Dashboard - LDAP Admin',
      stats,
      recentUsers,
      user: req.session.user
    });
  } catch (error) {
    logger.error('Error loading dashboard:', error);
    res.render('dashboard/index', {
      title: 'Dashboard - LDAP Admin',
      stats: { totalUsers: 0, totalGroups: 0, departmentStats: {} },
      recentUsers: [],
      user: req.session.user,
      error: 'Error al cargar estadísticas'
    });
  }
}));

// GET /dashboard/users - Lista de usuarios
router.get('/users', ErrorMiddleware.asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  
  try {
    let filter = '(objectClass=inetOrgPerson)';
    if (search) {
      filter = `(&(objectClass=inetOrgPerson)(|(cn=*${search}*)(mail=*${search}*)(displayName=*${search}*)))`;
    }
    
    const users = await ldapService.searchUsers(filter, ['cn', 'displayName', 'mail', 'title', 'departmentNumber'], limit * 2);
    
    // Filtrar usuarios válidos (no undefined/null)
    const validUsers = users.filter(user => user && user.cn);
    
    // Paginación simple
    const startIndex = (page - 1) * limit;
    const paginatedUsers = validUsers.slice(startIndex, startIndex + limit);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total: validUsers.length,
          hasMore: validUsers.length > startIndex + limit
        }
      });
    } else {
      res.render('dashboard/users', {
        title: 'Usuarios - LDAP Admin',
        users: paginatedUsers,
        search,
        pagination: {
          page,
          limit,
          total: validUsers.length,
          hasMore: validUsers.length > startIndex + limit
        }
      });
    }
  } catch (error) {
    logger.error('Error loading users:', error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ error: 'Error al cargar usuarios' });
    } else {
      res.render('dashboard/users', {
        title: 'Usuarios - LDAP Admin',
        users: [],
        search: '',
        error: 'Error al cargar usuarios'
      });
    }
  }
}));

// GET /dashboard/users/add - Formulario para agregar usuario
router.get('/users/add', ErrorMiddleware.asyncWrapper(async (req, res) => {
  res.render('dashboard/users-add', {
    title: 'Agregar Usuario - LDAP Admin',
    error: req.flash('error'),
    success: req.flash('success')
  });
}));

// Función de validación del servidor
const validateUserData = (userData) => {
  const errors = [];
  
  // Validar username
  if (!userData.username || userData.username.trim().length < 3) {
    errors.push('El nombre de usuario debe tener al menos 3 caracteres');
  }
  if (userData.username && !/^[a-zA-Z0-9._-]+$/.test(userData.username)) {
    errors.push('El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos');
  }
  
  // Validar nombre y apellido
  if (!userData.firstName || userData.firstName.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  if (!userData.lastName || userData.lastName.trim().length < 2) {
    errors.push('El apellido debe tener al menos 2 caracteres');
  }
  
  // Validar email si se proporciona
  if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('El email no tiene un formato válido');
  }
  
  // Validar contraseña
  if (!userData.password || userData.password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  if (userData.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.password)) {
    errors.push('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
  }
  
  return errors;
};

// POST /dashboard/users/add - Crear nuevo usuario
router.post('/users/add', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const { username, firstName, lastName, email, password, department, title } = req.body;
    
    // Validar datos del servidor
    const validationErrors = validateUserData(req.body);
    if (validationErrors.length > 0) {
      // Respuesta JSON para AJAX
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          errors: validationErrors
        });
      }
      
      req.flash('error', validationErrors.join('. '));
      return res.redirect('/dashboard/users/add');
    }
    
    // Verificar si el usuario ya existe
    try {
      const existingUserDN = `cn=${username.trim()},ou=people,dc=ejemplo,dc=com`;
      const existingUser = await ldapService.getUserByDN(existingUserDN);
      if (existingUser) {
        const error = 'Ya existe un usuario con ese nombre de usuario';
        
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(400).json({
            success: false,
            errors: [error]
          });
        }
        
        req.flash('error', error);
        return res.redirect('/dashboard/users/add');
      }
    } catch (err) {
      // Usuario no existe, continuar
    }
    
    // Crear el usuario en LDAP
    const userDN = `cn=${username.trim()},ou=people,dc=ejemplo,dc=com`;
    const userAttributes = {
      objectClass: ['inetOrgPerson', 'organizationalPerson', 'person'],
      cn: username.trim(),
      sn: lastName.trim(),
      givenName: firstName.trim(),
      displayName: `${firstName.trim()} ${lastName.trim()}`,
      uid: username.trim(),
      userPassword: password
    };
    
    if (email?.trim()) userAttributes.mail = email.trim();
    if (department?.trim()) userAttributes.departmentNumber = department.trim();
    if (title?.trim()) userAttributes.title = title.trim();
    
    await ldapService.createUser(userDN, userAttributes);
    
    // Respuesta JSON para AJAX
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          username: userAttributes.cn,
          name: userAttributes.displayName,
          email: userAttributes.mail || ''
        }
      });
    }
    
    req.flash('success', `Usuario ${username} creado exitosamente`);
    res.redirect('/dashboard/users');
  } catch (error) {
    logger.error('Error creating user:', error);
    
    // Respuesta JSON para AJAX
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({
        success: false,
        errors: [`Error del servidor: ${error.message}`]
      });
    }
    
    req.flash('error', 'Error al crear el usuario: ' + error.message);
    res.redirect('/dashboard/users/add');
  }
}));

// GET /dashboard/users/view/:dn - Ver detalles de usuario
router.get('/users/view/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const userDN = decodeURIComponent(req.params.dn);
    const user = await ldapService.getUserByDN(userDN);
    
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/dashboard/users');
    }
    
    // Obtener grupos del usuario
    const groups = await ldapService.getUserGroups(userDN);
    
    res.render('dashboard/users-view', {
      title: `Usuario: ${user.cn} - LDAP Admin`,
      user,
      groups
    });
  } catch (error) {
    logger.error('Error loading user:', error);
    req.flash('error', 'Error al cargar el usuario');
    res.redirect('/dashboard/users');
  }
}));

// GET /dashboard/users/edit/:dn - Formulario para editar usuario
router.get('/users/edit/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const userDN = decodeURIComponent(req.params.dn);
    const user = await ldapService.getUserByDN(userDN);
    
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/dashboard/users');
    }
    
    res.render('dashboard/users-edit', {
      title: `Editar Usuario: ${user.cn} - LDAP Admin`,
      user,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Error loading user for edit:', error);
    req.flash('error', 'Error al cargar el usuario');
    res.redirect('/dashboard/users');
  }
}));

// POST /dashboard/users/edit/:dn - Actualizar usuario
router.post('/users/edit/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const userDN = decodeURIComponent(req.params.dn);
    const { firstName, lastName, email, department, title } = req.body;
    
    const updates = {};
    if (firstName) updates.givenName = firstName;
    if (lastName) updates.sn = lastName;
    if (firstName && lastName) updates.displayName = `${firstName} ${lastName}`;
    if (email) updates.mail = email || [];
    if (department) updates.departmentNumber = department || [];
    if (title) updates.title = title || [];
    
    await ldapService.updateUser(userDN, updates);
    
    req.flash('success', 'Usuario actualizado exitosamente');
    res.redirect(`/dashboard/users/view/${encodeURIComponent(userDN)}`);
  } catch (error) {
    logger.error('Error updating user:', error);
    req.flash('error', 'Error al actualizar el usuario: ' + error.message);
    res.redirect(`/dashboard/users/edit/${encodeURIComponent(req.params.dn)}`);
  }
}));

// POST /dashboard/users/delete/:dn - Eliminar usuario
router.post('/users/delete/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const userDN = decodeURIComponent(req.params.dn);
    
    await ldapService.deleteUser(userDN);
    
    req.flash('success', 'Usuario eliminado exitosamente');
    res.redirect('/dashboard/users');
  } catch (error) {
    logger.error('Error deleting user:', error);
    req.flash('error', 'Error al eliminar el usuario: ' + error.message);
    res.redirect('/dashboard/users');
  }
}));

module.exports = router;