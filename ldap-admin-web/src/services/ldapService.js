const ldap = require('ldapjs');
const config = require('../../config');
const logger = require('./logger-simple');
const { promisify } = require('util');

class LDAPService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Crear conexión LDAP
  async createConnection() {
    return new Promise((resolve, reject) => {
      try {
        this.client = ldap.createClient({
          url: config.ldap.url,
          timeout: config.ldap.timeout,
          reconnect: config.ldap.reconnect
        });

        // Eventos de conexión
        this.client.on('connect', () => {
          logger.ldap.connection('connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          resolve(this.client);
        });

        this.client.on('error', (err) => {
          logger.ldap.error('connection', err);
          this.connected = false;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            logger.info(`Reintentando conexión LDAP (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.createConnection(), 5000);
          } else {
            reject(err);
          }
        });

        this.client.on('close', () => {
          logger.ldap.connection('disconnected');
          this.connected = false;
        });

      } catch (error) {
        logger.ldap.error('connection_create', error);
        reject(error);
      }
    });
  }

  // Obtener cliente LDAP (crear si no existe)
  async getClient() {
    if (!this.client || !this.connected) {
      await this.createConnection();
    }
    return this.client;
  }

  // Autenticar con credenciales de administrador
  async bindAsAdmin() {
    const client = await this.getClient();
    
    return new Promise((resolve, reject) => {
      client.bind(config.ldap.adminDN, config.ldap.adminPassword, (err) => {
        if (err) {
          logger.ldap.error('admin_bind', err);
          reject(err);
        } else {
          logger.ldap.operation('bind', config.ldap.adminDN, true);
          resolve();
        }
      });
    });
  }

  // Autenticar usuario específico
  async authenticateUser(username, password) {
    try {
      const client = await this.getClient();
      
      // Manejar caso especial del admin
      let userDN;
      if (username === 'admin') {
        userDN = config.ldap.adminDN;
      } else {
        userDN = `cn=${username},${config.ldap.userBaseDN}`;
      }

      return new Promise((resolve, reject) => {
        client.bind(userDN, password, (err) => {
          if (err) {
            logger.ldap.operation('authenticate', userDN, false, { error: err.message });
            resolve({ success: false, error: err.message });
          } else {
            logger.ldap.operation('authenticate', userDN, true);
            resolve({ success: true, userDN });
          }
        });
      });
    } catch (error) {
      logger.ldap.error('authenticate', error);
      return { success: false, error: error.message };
    }
  }

  // Buscar entrada por DN
  async searchByDN(dn, attributes = []) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();

      return new Promise((resolve, reject) => {
        client.search(dn, {
          scope: 'base',
          attributes: attributes.length > 0 ? attributes : undefined
        }, (err, res) => {
          if (err) {
            logger.ldap.error('search_dn', err, { dn });
            reject(err);
            return;
          }

          const entries = [];
          res.on('searchEntry', (entry) => {
            entries.push(entry.object);
          });

          res.on('error', (err) => {
            logger.ldap.error('search_dn_result', err, { dn });
            reject(err);
          });

          res.on('end', (result) => {
            logger.ldap.search(dn, 'base', entries.length);
            resolve(entries[0] || null);
          });
        });
      });
    } catch (error) {
      logger.ldap.error('search_dn', error, { dn });
      throw error;
    }
  }

  // Buscar usuarios
  async searchUsers(filter = '(objectClass=inetOrgPerson)', attributes = [], limit = 100) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();

      return new Promise((resolve, reject) => {
        const searchOptions = {
          filter,
          scope: 'sub',
          attributes: attributes.length > 0 ? attributes : undefined,
          sizeLimit: limit
        };

        client.search(config.ldap.userBaseDN, searchOptions, (err, res) => {
          if (err) {
            logger.ldap.error('search_users', err, { filter });
            reject(err);
            return;
          }

          const entries = [];
          res.on('searchEntry', (entry) => {
            if (entry && entry.object) {
              const user = entry.object;
              // Asegurar que el DN esté incluido
              user.dn = entry.objectName || entry.dn;
              entries.push(user);
            }
          });

          res.on('error', (err) => {
            logger.ldap.error('search_users_result', err, { filter });
            reject(err);
          });

          res.on('end', (result) => {
            logger.ldap.search(config.ldap.userBaseDN, filter, entries.length);
            resolve(entries);
          });
        });
      });
    } catch (error) {
      logger.ldap.error('search_users', error, { filter });
      throw error;
    }
  }

  // Buscar grupos
  async searchGroups(filter = '(objectClass=groupOfNames)', attributes = [], limit = 100) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();

      return new Promise((resolve, reject) => {
        const searchOptions = {
          filter,
          scope: 'sub',
          attributes: attributes.length > 0 ? attributes : undefined,
          sizeLimit: limit
        };

        client.search(config.ldap.groupBaseDN, searchOptions, (err, res) => {
          if (err) {
            logger.ldap.error('search_groups', err, { filter });
            reject(err);
            return;
          }

          const entries = [];
          res.on('searchEntry', (entry) => {
            if (entry && entry.object) {
              const group = entry.object;
              // Asegurar que el DN esté incluido
              group.dn = entry.objectName || entry.dn;
              entries.push(group);
            }
          });

          res.on('error', (err) => {
            logger.ldap.error('search_groups_result', err, { filter });
            reject(err);
          });

          res.on('end', (result) => {
            logger.ldap.search(config.ldap.groupBaseDN, filter, entries.length);
            resolve(entries);
          });
        });
      });
    } catch (error) {
      logger.ldap.error('search_groups', error, { filter });
      throw error;
    }
  }

  // Agregar nueva entrada
  async addEntry(dn, attributes) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();

      return new Promise((resolve, reject) => {
        client.add(dn, attributes, (err) => {
          if (err) {
            logger.ldap.error('add_entry', err, { dn, attributes });
            reject(err);
          } else {
            logger.ldap.operation('add', dn, true);
            resolve();
          }
        });
      });
    } catch (error) {
      logger.ldap.error('add_entry', error, { dn });
      throw error;
    }
  }

  // Modificar entrada existente
  async modifyEntry(dn, changes) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();

      return new Promise((resolve, reject) => {
        client.modify(dn, changes, (err) => {
          if (err) {
            logger.ldap.error('modify_entry', err, { dn, changes });
            reject(err);
          } else {
            logger.ldap.operation('modify', dn, true, { changes });
            resolve();
          }
        });
      });
    } catch (error) {
      logger.ldap.error('modify_entry', error, { dn });
      throw error;
    }
  }

  // Eliminar entrada
  async deleteEntry(dn) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();

      return new Promise((resolve, reject) => {
        client.del(dn, (err) => {
          if (err) {
            logger.ldap.error('delete_entry', err, { dn });
            reject(err);
          } else {
            logger.ldap.operation('delete', dn, true);
            resolve();
          }
        });
      });
    } catch (error) {
      logger.ldap.error('delete_entry', error, { dn });
      throw error;
    }
  }

  // Obtener información de usuario por username
  async getUserByUsername(username) {
    const filter = `(cn=${username})`;
    
    // Primero buscar en ou=people
    const users = await this.searchUsers(filter);
    if (users.length > 0) {
      return users[0];
    }
    
    // Si es admin y no se encuentra en ou=people, buscar directamente en adminDN
    if (username === 'admin') {
      try {
        const adminUser = await this.searchByDN(config.ldap.adminDN);
        if (adminUser) {
          return adminUser;
        }
      } catch (error) {
        logger.warn('No se pudo obtener información del admin desde adminDN:', error.message);
      }
    }
    
    return null;
  }

  // Obtener miembros de un grupo
  async getGroupMembers(groupName) {
    const filter = `(cn=${groupName})`;
    const groups = await this.searchGroups(filter, ['member']);
    
    if (groups.length === 0) {
      return [];
    }

    const group = groups[0];
    const memberDNs = Array.isArray(group.member) ? group.member : [group.member];
    
    const members = [];
    for (const memberDN of memberDNs) {
      try {
        const member = await this.searchByDN(memberDN, ['cn', 'displayName', 'mail']);
        if (member) {
          members.push(member);
        }
      } catch (error) {
        logger.warn(`No se pudo obtener información del miembro: ${memberDN}`);
      }
    }

    return members;
  }

  // Obtener grupos de un usuario
  async getUserGroups(userDN) {
    const filter = `(member=${userDN})`;
    return await this.searchGroups(filter, ['cn', 'description']);
  }

  // Verificar si un usuario pertenece a un grupo
  async isUserInGroup(userDN, groupName) {
    const userGroups = await this.getUserGroups(userDN);
    return userGroups.some(group => group.cn === groupName);
  }

  // Obtener estadísticas del directorio
  async getDirectoryStats() {
    try {
      const [users, groups] = await Promise.all([
        this.searchUsers('(objectClass=inetOrgPerson)', ['cn']),
        this.searchGroups('(objectClass=groupOfNames)', ['cn'])
      ]);

      // Obtener estadísticas por departamento
      const departments = {};
      const usersByDept = await this.searchUsers('(objectClass=inetOrgPerson)', ['departmentNumber']);
      
      usersByDept.filter(user => user != null).forEach(user => {
        const dept = user.departmentNumber || 'Sin departamento';
        departments[dept] = (departments[dept] || 0) + 1;
      });

      return {
        totalUsers: users.length,
        totalGroups: groups.length,
        departmentStats: departments,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.ldap.error('directory_stats', error);
      throw error;
    }
  }

  // Probar conexión LDAP
  async testConnection() {
    try {
      await this.bindAsAdmin();
      
      // Hacer una búsqueda simple para verificar que todo funciona
      await this.searchUsers('(objectClass=inetOrgPerson)', ['cn'], 1);
      
      return {
        success: true,
        message: 'Conexión LDAP exitosa',
        server: config.ldap.url,
        baseDN: config.ldap.baseDN
      };
    } catch (error) {
      logger.ldap.error('test_connection', error);
      return {
        success: false,
        message: error.message,
        server: config.ldap.url
      };
    }
  }

  // Cerrar conexión
  async disconnect() {
    if (this.client) {
      this.client.unbind();
      this.client = null;
      this.connected = false;
      logger.ldap.connection('disconnected_manual');
    }
  }

  // Obtener usuario por DN
  async getUserByDN(userDN) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();
      
      const searchOptions = {
        scope: 'base',
        filter: '(objectClass=*)',
        attributes: ['*']
      };
      
      return new Promise((resolve, reject) => {
        client.search(userDN, searchOptions, (err, res) => {
          if (err) {
            logger.ldap.error('getUserByDN_search', err, { dn: userDN });
            reject(err);
            return;
          }

          let user = null;
          
          res.on('searchEntry', (entry) => {
            user = entry.object;
            user.dn = userDN; // Asegurar que el DN esté incluido
          });
          
          res.on('error', (error) => {
            logger.ldap.error('getUserByDN_result', error, { dn: userDN });
            reject(error);
          });
          
          res.on('end', () => {
            if (user) {
              logger.ldap.search(userDN, 'base', 1);
            }
            resolve(user);
          });
        });
      });
    } catch (error) {
      logger.ldap.error('getUserByDN', error, { dn: userDN });
      throw error;
    }
  }

  // Crear nuevo usuario
  async createUser(userDN, attributes) {
    try {
      await this.bindAsAdmin();
      
      const entry = {
        ...attributes
      };
      
      return new Promise((resolve, reject) => {
        this.client.add(userDN, entry, (error) => {
          if (error) {
            logger.ldap.error('createUser', error);
            reject(error);
          } else {
            logger.ldap.operation('createUser', `Usuario creado: ${userDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('createUser', error);
      throw error;
    }
  }

  // Actualizar usuario
  async updateUser(userDN, updates) {
    try {
      await this.bindAsAdmin();
      
      const changes = [];
      for (const [attr, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const modification = {
            operation: 'replace',
            modification: {}
          };
          modification.modification[attr] = Array.isArray(value) ? value : [value];
          changes.push(modification);
        }
      }
      
      if (changes.length === 0) {
        return true;
      }
      
      return new Promise((resolve, reject) => {
        this.client.modify(userDN, changes, (error) => {
          if (error) {
            logger.ldap.error('updateUser', error);
            reject(error);
          } else {
            logger.ldap.operation('updateUser', `Usuario actualizado: ${userDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('updateUser', error);
      throw error;
    }
  }

  // Eliminar usuario
  async deleteUser(userDN) {
    try {
      await this.bindAsAdmin();
      
      return new Promise((resolve, reject) => {
        this.client.del(userDN, (error) => {
          if (error) {
            logger.ldap.error('deleteUser', error);
            reject(error);
          } else {
            logger.ldap.operation('deleteUser', `Usuario eliminado: ${userDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('deleteUser', error);
      throw error;
    }
  }

  // Crear un nuevo grupo
  async createGroup(groupDN, attributes) {
    try {
      await this.bindAsAdmin();
      
      const entry = {
        objectClass: ['groupOfNames', 'top'],
        ...attributes,
        // Asegurar que siempre haya al menos un miembro (requerido por groupOfNames)
        member: attributes.member || config.ldap.adminDN
      };
      
      return new Promise((resolve, reject) => {
        this.client.add(groupDN, entry, (error) => {
          if (error) {
            logger.ldap.error('createGroup', error, { dn: groupDN });
            reject(error);
          } else {
            logger.ldap.operation('createGroup', `Grupo creado: ${groupDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('createGroup', error, { dn: groupDN });
      throw error;
    }
  }

  // Obtener grupo por DN
  async getGroupByDN(groupDN) {
    try {
      await this.bindAsAdmin();
      const client = await this.getClient();
      
      const searchOptions = {
        scope: 'base',
        filter: '(objectClass=groupOfNames)',
        attributes: ['*']
      };
      
      return new Promise((resolve, reject) => {
        client.search(groupDN, searchOptions, (err, res) => {
          if (err) {
            logger.ldap.error('getGroupByDN_search', err, { dn: groupDN });
            reject(err);
            return;
          }

          let group = null;
          
          res.on('searchEntry', (entry) => {
            group = entry.object;
            group.dn = groupDN;
          });
          
          res.on('error', (error) => {
            logger.ldap.error('getGroupByDN_result', error, { dn: groupDN });
            reject(error);
          });
          
          res.on('end', () => {
            resolve(group);
          });
        });
      });
    } catch (error) {
      logger.ldap.error('getGroupByDN', error, { dn: groupDN });
      throw error;
    }
  }

  // Actualizar grupo
  async updateGroup(groupDN, updates) {
    try {
      await this.bindAsAdmin();
      
      const changes = [];
      for (const [attr, value] of Object.entries(updates)) {
        if (value !== undefined && attr !== 'member') {
          const modification = {
            operation: 'replace',
            modification: {}
          };
          modification.modification[attr] = Array.isArray(value) ? value : [value];
          changes.push(modification);
        }
      }
      
      if (changes.length === 0) {
        return true;
      }
      
      return new Promise((resolve, reject) => {
        this.client.modify(groupDN, changes, (error) => {
          if (error) {
            logger.ldap.error('updateGroup', error, { dn: groupDN });
            reject(error);
          } else {
            logger.ldap.operation('updateGroup', `Grupo actualizado: ${groupDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('updateGroup', error, { dn: groupDN });
      throw error;
    }
  }

  // Eliminar grupo
  async deleteGroup(groupDN) {
    try {
      await this.bindAsAdmin();
      
      return new Promise((resolve, reject) => {
        this.client.del(groupDN, (error) => {
          if (error) {
            logger.ldap.error('deleteGroup', error, { dn: groupDN });
            reject(error);
          } else {
            logger.ldap.operation('deleteGroup', `Grupo eliminado: ${groupDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('deleteGroup', error, { dn: groupDN });
      throw error;
    }
  }

  // Agregar usuario a grupo
  async addUserToGroup(groupDN, userDN) {
    try {
      await this.bindAsAdmin();
      
      const change = {
        operation: 'add',
        modification: {
          member: userDN
        }
      };
      
      return new Promise((resolve, reject) => {
        this.client.modify(groupDN, change, (error) => {
          if (error) {
            logger.ldap.error('addUserToGroup', error, { groupDN, userDN });
            reject(error);
          } else {
            logger.ldap.operation('addUserToGroup', `Usuario ${userDN} agregado a ${groupDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('addUserToGroup', error, { groupDN, userDN });
      throw error;
    }
  }

  // Remover usuario de grupo
  async removeUserFromGroup(groupDN, userDN) {
    try {
      await this.bindAsAdmin();
      
      const change = {
        operation: 'delete',
        modification: {
          member: userDN
        }
      };
      
      return new Promise((resolve, reject) => {
        this.client.modify(groupDN, change, (error) => {
          if (error) {
            logger.ldap.error('removeUserFromGroup', error, { groupDN, userDN });
            reject(error);
          } else {
            logger.ldap.operation('removeUserFromGroup', `Usuario ${userDN} removido de ${groupDN}`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.ldap.error('removeUserFromGroup', error, { groupDN, userDN });
      throw error;
    }
  }

  // Obtener todos los departamentos
  async getAllDepartments() {
    try {
      const users = await this.searchUsers('(departmentNumber=*)', ['departmentNumber']);
      const departments = new Set();
      
      users.forEach(user => {
        if (user.departmentNumber) {
          departments.add(user.departmentNumber);
        }
      });
      
      return Array.from(departments).sort();
    } catch (error) {
      logger.ldap.error('getAllDepartments', error);
      throw error;
    }
  }

  // Obtener grupos de un usuario
  async getUserGroups(userDN) {
    try {
      const filter = `(&(objectClass=groupOfNames)(member=${userDN}))`;
      const groups = await this.searchGroups(filter, ['cn', 'description']);
      return groups.filter(group => group && group.cn);
    } catch (error) {
      logger.ldap.error('getUserGroups', error, { userDN });
      return [];
    }
  }
}

// Crear instancia singleton
const ldapService = new LDAPService();

module.exports = ldapService;