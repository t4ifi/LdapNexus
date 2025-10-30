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

// ============================================
// RUTAS DE GRUPOS
// ============================================

// GET /dashboard/groups - Lista de grupos
router.get('/groups', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const filter = '(objectClass=groupOfNames)';
    const groups = await ldapService.searchGroups(filter, ['cn', 'description', 'member']);
    
    // Contar miembros de cada grupo
    const groupsWithCount = groups.map(group => ({
      ...group,
      memberCount: Array.isArray(group.member) ? group.member.length : (group.member ? 1 : 0)
    }));
    
    res.render('dashboard/groups', {
      title: 'Grupos - LDAP Admin',
      groups: groupsWithCount
    });
  } catch (error) {
    logger.error('Error loading groups:', error);
    res.render('dashboard/groups', {
      title: 'Grupos - LDAP Admin',
      groups: [],
      error: 'Error al cargar grupos'
    });
  }
}));

// GET /dashboard/groups/add - Formulario para agregar grupo
router.get('/groups/add', ErrorMiddleware.asyncWrapper(async (req, res) => {
  res.render('dashboard/groups-add', {
    title: 'Agregar Grupo - LDAP Admin',
    error: req.flash('error'),
    success: req.flash('success')
  });
}));

// POST /dashboard/groups/add - Crear nuevo grupo
router.post('/groups/add', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const { groupName, description } = req.body;
    
    if (!groupName || groupName.trim().length < 2) {
      req.flash('error', 'El nombre del grupo debe tener al menos 2 caracteres');
      return res.redirect('/dashboard/groups/add');
    }
    
    // Crear el grupo en LDAP
    const groupDN = `cn=${groupName.trim()},ou=groups,dc=ejemplo,dc=com`;
    const groupAttributes = {
      cn: groupName.trim()
    };
    
    if (description?.trim()) {
      groupAttributes.description = description.trim();
    }
    
    await ldapService.createGroup(groupDN, groupAttributes);
    
    req.flash('success', `Grupo ${groupName} creado exitosamente`);
    res.redirect('/dashboard/groups');
  } catch (error) {
    logger.error('Error creating group:', error);
    req.flash('error', 'Error al crear el grupo: ' + error.message);
    res.redirect('/dashboard/groups/add');
  }
}));

// GET /dashboard/groups/view/:dn - Ver detalles de grupo
router.get('/groups/view/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const groupDN = decodeURIComponent(req.params.dn);
    const group = await ldapService.getGroupByDN(groupDN);
    
    if (!group) {
      req.flash('error', 'Grupo no encontrado');
      return res.redirect('/dashboard/groups');
    }
    
    // Obtener información de los miembros
    let members = [];
    if (group.member) {
      const memberDNs = Array.isArray(group.member) ? group.member : [group.member];
      
      for (const memberDN of memberDNs) {
        try {
          const user = await ldapService.getUserByDN(memberDN);
          if (user) {
            members.push(user);
          }
        } catch (err) {
          // Usuario no encontrado o error, continuar
          logger.warn('Could not load member:', memberDN, err.message);
        }
      }
    }
    
    res.render('dashboard/groups-view', {
      title: `Grupo: ${group.cn} - LDAP Admin`,
      group,
      members
    });
  } catch (error) {
    logger.error('Error loading group:', error);
    req.flash('error', 'Error al cargar el grupo');
    res.redirect('/dashboard/groups');
  }
}));

// GET /dashboard/groups/edit/:dn - Formulario para editar grupo
router.get('/groups/edit/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const groupDN = decodeURIComponent(req.params.dn);
    const group = await ldapService.getGroupByDN(groupDN);
    
    if (!group) {
      req.flash('error', 'Grupo no encontrado');
      return res.redirect('/dashboard/groups');
    }
    
    res.render('dashboard/groups-edit', {
      title: `Editar Grupo: ${group.cn} - LDAP Admin`,
      group,
      error: req.flash('error'),
      success: req.flash('success')
    });
  } catch (error) {
    logger.error('Error loading group for edit:', error);
    req.flash('error', 'Error al cargar el grupo');
    res.redirect('/dashboard/groups');
  }
}));

// POST /dashboard/groups/edit/:dn - Actualizar grupo
router.post('/groups/edit/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const groupDN = decodeURIComponent(req.params.dn);
    const { description } = req.body;
    
    const updates = {};
    if (description !== undefined) {
      updates.description = description.trim() || [];
    }
    
    await ldapService.updateGroup(groupDN, updates);
    
    req.flash('success', 'Grupo actualizado exitosamente');
    res.redirect(`/dashboard/groups/view/${encodeURIComponent(groupDN)}`);
  } catch (error) {
    logger.error('Error updating group:', error);
    req.flash('error', 'Error al actualizar el grupo: ' + error.message);
    res.redirect(`/dashboard/groups/edit/${encodeURIComponent(req.params.dn)}`);
  }
}));

// POST /dashboard/groups/delete/:dn - Eliminar grupo
router.post('/groups/delete/:dn', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const groupDN = decodeURIComponent(req.params.dn);
    
    await ldapService.deleteGroup(groupDN);
    
    req.flash('success', 'Grupo eliminado exitosamente');
    res.redirect('/dashboard/groups');
  } catch (error) {
    logger.error('Error deleting group:', error);
    req.flash('error', 'Error al eliminar el grupo: ' + error.message);
    res.redirect('/dashboard/groups');
  }
}));

// POST /dashboard/groups/:groupDn/members/add - Agregar usuario a grupo
router.post('/groups/:groupDn/members/add', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const groupDN = decodeURIComponent(req.params.groupDn);
    const { userDN } = req.body;
    
    if (!userDN) {
      req.flash('error', 'Debe seleccionar un usuario');
      return res.redirect(`/dashboard/groups/view/${encodeURIComponent(groupDN)}`);
    }
    
    await ldapService.addUserToGroup(groupDN, userDN);
    
    req.flash('success', 'Usuario agregado al grupo exitosamente');
    res.redirect(`/dashboard/groups/view/${encodeURIComponent(groupDN)}`);
  } catch (error) {
    logger.error('Error adding user to group:', error);
    req.flash('error', 'Error al agregar usuario al grupo: ' + error.message);
    res.redirect(`/dashboard/groups/view/${encodeURIComponent(req.params.groupDn)}`);
  }
}));

// POST /dashboard/groups/:groupDn/members/remove - Remover usuario de grupo
router.post('/groups/:groupDn/members/remove', ErrorMiddleware.asyncWrapper(async (req, res) => {
  try {
    const groupDN = decodeURIComponent(req.params.groupDn);
    const { userDN } = req.body;
    
    if (!userDN) {
      req.flash('error', 'Debe especificar un usuario');
      return res.redirect(`/dashboard/groups/view/${encodeURIComponent(groupDN)}`);
    }
    
    await ldapService.removeUserFromGroup(groupDN, userDN);
    
    req.flash('success', 'Usuario removido del grupo exitosamente');
    res.redirect(`/dashboard/groups/view/${encodeURIComponent(groupDN)}`);
  } catch (error) {
    logger.error('Error removing user from group:', error);
    req.flash('error', 'Error al remover usuario del grupo: ' + error.message);
    res.redirect(`/dashboard/groups/view/${encodeURIComponent(req.params.groupDn)}`);
  }
}));

module.exports = router;