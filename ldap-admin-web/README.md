# LDAP Admin Web

## 🌟 Interfaz Web Completa para Administración LDAP

Una aplicación web moderna, segura y educativa para administrar servidores LDAP con características de aprendizaje integradas.

### 🚀 Características Principales

#### 🔐 **Seguridad Avanzada**
- **Autenticación LDAP**: Login directo con credenciales del directorio
- **Sesiones Seguras**: Gestión de sesiones con expiración automática
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **CSRF Protection**: Tokens anti-falsificación de requests
- **Input Sanitization**: Validación y sanitización de todas las entradas
- **Security Headers**: Headers HTTP de seguridad implementados
- **Logging de Auditoría**: Registro completo de actividades administrativas

#### 🎓 **Características Educativas**
- **Tutorial Interactivo**: Aprende LDAP paso a paso
- **Ejemplos Prácticos**: Comandos LDAP con explicaciones
- **Visualización de Estructura**: Árbol del directorio LDAP
- **Playground LDAP**: Espacio seguro para experimentar
- **Documentación Integrada**: Guías y referencias

#### ⚙️ **Administración Completa**
- **Gestión de Usuarios**: Crear, modificar, eliminar usuarios LDAP
- **Gestión de Grupos**: Administrar grupos y membresías
- **Búsqueda Avanzada**: Filtros potentes para encontrar entradas
- **Dashboard Estadístico**: Métricas en tiempo real del directorio
- **Backup y Restore**: Herramientas de respaldo integradas

### 🏗️ **Arquitectura Técnica**

#### **Backend (Node.js)**
```
├── src/
│   ├── app.js                 # Servidor Express principal
│   ├── middleware/            # Middleware personalizado
│   │   ├── auth.js           # Autenticación y autorización
│   │   ├── security.js       # Seguridad y validación
│   │   └── error.js          # Manejo de errores
│   ├── services/             # Servicios de negocio
│   │   ├── ldapService.js    # Conexión y operaciones LDAP
│   │   └── logger.js         # Sistema de logging
│   ├── routes/               # Rutas de la aplicación
│   │   ├── auth.js           # Rutas de autenticación
│   │   ├── dashboard.js      # Panel principal
│   │   ├── api.js            # API REST
│   │   └── education.js      # Módulo educativo
│   └── controllers/          # Controladores MVC
└── config/                   # Configuración
    └── index.js              # Configuración principal
```

#### **Frontend**
```
├── views/                    # Plantillas EJS
│   ├── layout.ejs           # Layout base
│   ├── auth/                # Vistas de autenticación
│   ├── dashboard/           # Vistas del panel
│   └── error.ejs           # Página de errores
├── public/
│   ├── css/
│   │   └── admin.css       # Estilos personalizados
│   └── js/
│       └── admin.js        # JavaScript principal
```

### 🐳 **Configuración con Docker**

#### **Variables de Entorno**
```bash
NODE_ENV=development          # Entorno de ejecución
PORT=3000                    # Puerto de la aplicación
LDAP_URL=ldap://openldap:389 # URL del servidor LDAP
LDAP_BASE_DN=dc=ejemplo,dc=com # DN base del directorio
LDAP_ADMIN_DN=cn=admin,dc=ejemplo,dc=com # DN del administrador
LDAP_ADMIN_PASSWORD=admin123  # Contraseña del administrador
SESSION_SECRET=your-secret-key # Clave secreta para sesiones
LOG_LEVEL=info               # Nivel de logging
```

#### **Puertos Expuestos**
- **3000**: Aplicación web principal
- **389**: Servidor LDAP (desde contenedor OpenLDAP)
- **8080**: phpLDAPadmin (interfaz alternativa)

### 🔧 **Instalación y Uso**

#### **Opción 1: Con Make (Recomendado)**
```bash
# Instalar dependencias
make install-web

# Compilar y levantar aplicación completa
make up-full

# Solo servicios básicos (sin app web)
make up-basic

# Ver logs de la aplicación web
make logs-web
```

#### **Opción 2: Docker Compose Directo**
```bash
# Instalar dependencias
cd ldap-admin-web && npm install

# Levantar todo el entorno
docker-compose up -d

# Ver logs
docker-compose logs -f ldap-admin-web
```

#### **Opción 3: Desarrollo Local**
```bash
cd ldap-admin-web

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en modo desarrollo
npm run dev
```

### 🌐 **Acceso a la Aplicación**

Una vez levantado el entorno:

- **Aplicación Web**: http://localhost:3000
- **phpLDAPadmin**: http://localhost:8080
- **API REST**: http://localhost:3000/api/v1

#### **Credenciales de Prueba**
| Usuario | Contraseña | Departamento | Rol |
|---------|-----------|--------------|-----|
| juan.perez | password123 | IT | Desarrollador |
| maria.garcia | password123 | HR | Analista RRHH |
| ana.martinez | password123 | IT | Admin (permisos completos) |

### 📊 **Funcionalidades Principales**

#### **Dashboard**
- Estadísticas en tiempo real del directorio LDAP
- Gráficos de distribución por departamentos
- Usuarios recientes y actividad del sistema
- Acciones rápidas para tareas comunes

#### **Gestión de Usuarios**
- Lista paginada con búsqueda avanzada
- Formularios de creación y edición
- Gestión de membresías de grupos
- Historial de cambios y auditoría

#### **Sistema Educativo**
- Tutoriales paso a paso sobre conceptos LDAP
- Ejemplos interactivos de comandos
- Visualización de la estructura del directorio
- Playground para experimentar de forma segura

### 🔒 **Características de Seguridad**

#### **Autenticación y Autorización**
- Login mediante credenciales LDAP
- Sistema de roles basado en grupos LDAP
- Sesiones seguras con expiración automática
- Logout automático por inactividad

#### **Protección contra Ataques**
- Rate limiting global y específico por endpoint
- Protección CSRF con tokens únicos
- Validación y sanitización de todas las entradas
- Headers de seguridad (HSTS, CSP, etc.)
- Detección de actividad sospechosa

#### **Logging y Auditoría**
- Logs estructurados en formato JSON
- Separación de logs por tipo (seguridad, LDAP, aplicación)
- Rotación automática de archivos de log
- Alertas de seguridad en tiempo real

### 📈 **Monitoreo y Salud**

#### **Health Checks**
```bash
# Estado general de la aplicación
curl http://localhost:3000/health

# Información detallada del sistema
curl http://localhost:3000/info
```

#### **Métricas Disponibles**
- Conexiones LDAP activas
- Usuarios autenticados
- Requests por segundo
- Tiempo de respuesta promedio
- Errores y excepciones

### 🛠️ **Desarrollo y Extensión**

#### **Estructura Modular**
La aplicación está diseñada con una arquitectura modular que permite:
- Agregar nuevos módulos educativos
- Extender funcionalidades de administración
- Personalizar la interfaz de usuario
- Integrar con otros sistemas de autenticación

#### **API REST**
Endpoints disponibles para integración:
```
GET  /api/v1/users           # Lista usuarios
POST /api/v1/users           # Crear usuario
GET  /api/v1/users/:dn       # Obtener usuario específico
PUT  /api/v1/users/:dn       # Actualizar usuario
DELETE /api/v1/users/:dn     # Eliminar usuario
GET  /api/v1/groups          # Lista grupos
GET  /api/v1/stats           # Estadísticas del directorio
```

### 🚨 **Troubleshooting**

#### **Problemas Comunes**

1. **Error de conexión LDAP**
   ```bash
   # Verificar que OpenLDAP esté corriendo
   docker-compose ps openldap
   
   # Ver logs del servidor LDAP
   docker-compose logs openldap
   ```

2. **Aplicación web no inicia**
   ```bash
   # Ver logs detallados
   make logs-web
   
   # Verificar variables de entorno
   docker-compose config
   ```

3. **Error de autenticación**
   ```bash
   # Probar conexión LDAP directamente
   ldapsearch -x -H ldap://localhost:389 -b "dc=ejemplo,dc=com" -D "cn=admin,dc=ejemplo,dc=com" -w admin123
   ```

### 📚 **Recursos Adicionales**

- **Documentación LDAP**: Incluida en la aplicación
- **Ejemplos de Comandos**: `/education/examples`
- **API Documentation**: `/api/v1/docs` (cuando esté implementada)
- **GitHub Repository**: Enlaces en la aplicación

### 🤝 **Contribución**

Este proyecto está diseñado para ser extensible y educativo. Las áreas donde se puede contribuir incluyen:

- Nuevos módulos educativos
- Funcionalidades adicionales de administración
- Mejoras en la interfaz de usuario
- Traducciones a otros idiomas
- Documentación y tutoriales

### 📄 **Licencia**

MIT License - Ver archivo LICENSE para detalles completos.

---

**¡Disfruta aprendiendo y administrando LDAP de manera segura y profesional!** 🎉