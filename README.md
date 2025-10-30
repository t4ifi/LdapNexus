# 🌐 LdapNexus# Docker LDAP - Guía Completa



[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)## ¿Qué es LDAP?

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)**LDAP (Lightweight Directory Access Protocol)** es un protocolo de aplicación abierto y estándar para acceder y mantener servicios de información de directorio distribuidos sobre una red de protocolo de Internet.

[![OpenLDAP](https://img.shields.io/badge/OpenLDAP-1.5.0-orange.svg)](https://www.openldap.org/)

### Conceptos Fundamentales

**LdapNexus** es una interfaz web moderna, segura y completa para la administración y aprendizaje de directorios LDAP/OpenLDAP. Diseñada con las mejores prácticas de seguridad y UX, proporciona una experiencia intuitiva para gestionar usuarios, grupos y configuraciones LDAP.

#### 1. **Directorio vs Base de Datos**

## ✨ Características Principales- **Directorio**: Optimizado for lectura, estructura jerárquica, información relativamente estática

- **Base de Datos**: Optimizada para escritura/lectura, estructura relacional, transacciones ACID

### 🔐 Seguridad Empresarial

- **Autenticación LDAP** nativa y segura#### 2. **Estructura Jerárquica (DIT - Directory Information Tree)**

- **Protección CSRF** con tokens únicos por sesión```

- **Rate Limiting** para prevenir ataques de fuerza brutadc=ejemplo,dc=com (raíz del dominio)

- **Helmet.js** para headers de seguridad HTTP├── ou=people (usuarios)

- **Sanitización de entradas** contra XSS e inyección LDAP│   ├── cn=juan.perez

- **Gestión segura de sesiones** con Express Session│   ├── cn=maria.garcia

- **Logging completo** con Winston (rotación diaria)│   └── cn=carlos.rodriguez

├── ou=groups (grupos)

### 👥 Gestión de Usuarios│   ├── cn=administrators

- **CRUD completo** de usuarios LDAP│   ├── cn=developers

- **Validaciones en tiempo real** (cliente y servidor)│   └── cn=users

- **Búsqueda y filtrado** dinámico con debounce└── ou=departments (departamentos)

- **Paginación** eficiente de resultados    ├── ou=IT

- **Modales elegantes** para confirmaciones    ├── ou=HR

- **Feedback visual** instantáneo (toasts, badges)    └── ou=Sales

- **Auto-sugerencia** de usernames```



### 📊 Dashboard Intuitivo#### 3. **Componentes de DN (Distinguished Name)**

- **Estadísticas en tiempo real** del directorio- **DN**: Nombre único que identifica una entrada (ej: `cn=juan.perez,ou=people,dc=ejemplo,dc=com`)

- **Usuarios recientes** y actividad- **RDN**: Componente relativo del DN (ej: `cn=juan.perez`)

- **Gráficos por departamento** y grupos- **DC**: Domain Component (ej: `dc=ejemplo`, `dc=com`)

- **Estado del servidor** LDAP- **CN**: Common Name (ej: `cn=juan.perez`)

- **Navegación responsive** (móvil/desktop)- **OU**: Organizational Unit (ej: `ou=people`)

- **O**: Organization (ej: `o=Mi Empresa`)

### 🎨 Diseño Moderno

- **Bootstrap 5** con tema personalizado#### 4. **ObjectClass y Atributos**

- **Font Awesome** icons- **ObjectClass**: Define el tipo de objeto y qué atributos puede tener

- **Animaciones suaves** y transiciones  - `inetOrgPerson`: Persona con atributos de internet (email, teléfono)

- **Modo claro** optimizado para legibilidad  - `organizationalUnit`: Unidad organizacional

- **Componentes reutilizables**  - `groupOfNames`: Grupo que contiene miembros

  - `posixAccount`: Cuenta UNIX/Linux

### 🛠️ DevOps Ready

- **Docker Compose** completo (LDAP + Web)- **Atributos comunes**:

- **Healthchecks** automáticos  - `cn` (Common Name): Nombre común

- **Persistencia de datos** en volúmenes  - `sn` (Surname): Apellido

- **Variables de entorno** configurables  - `givenName`: Nombre de pila

- **Hot reload** en desarrollo  - `mail`: Correo electrónico

- **Logs estructurados**  - `uid`: ID de usuario único

  - `userPassword`: Contraseña del usuario

## 🚀 Inicio Rápido

## Cómo Funciona LDAP

### Prerrequisitos

### 1. **Modelo de Información**

- **Docker** >= 20.x- Los datos se almacenan en una estructura de árbol jerárquica

- **Docker Compose** >= 2.x- Cada nodo del árbol es una entrada con atributos

- **Git**- Las entradas se identifican únicamente por su DN



### Instalación en 3 pasos### 2. **Modelo de Nombres**

- Cada entrada tiene un DN (Distinguished Name) único

1. **Clonar el repositorio**- El DN se forma concatenando RDNs desde la entrada hasta la raíz

```bash

git clone https://github.com/t4ifi/LdapNexus.git### 3. **Modelo Funcional**

cd LdapNexusLDAP define operaciones para:

```- **Bind**: Autenticación

- **Search**: Búsqueda de entradas

2. **Iniciar los contenedores**- **Add**: Agregar nuevas entradas

```bash- **Modify**: Modificar entradas existentes

docker-compose up -d- **Delete**: Eliminar entradas

```- **ModifyDN**: Cambiar el DN de una entrada



3. **Acceder a la aplicación**### 4. **Modelo de Seguridad**

- **Autenticación**: Verificar identidad (bind)

Abre tu navegador en: **http://localhost:3000**- **Autorización**: Controlar acceso a recursos (ACL)

- **Cifrado**: TLS/SSL para proteger datos en tránsito

**Credenciales por defecto:**

- Usuario: `admin`## Casos de Uso Comunes

- Contraseña: `admin123`

### 1. **Autenticación Centralizada**

## 📋 Configuración- Single Sign-On (SSO)

- Autenticación de aplicaciones web

### Variables de Entorno- Login de sistemas operativos



El archivo `docker-compose.yml` incluye todas las configuraciones necesarias. Las principales variables son:### 2. **Directorio de Empleados**

- Información de contacto

#### OpenLDAP- Estructura organizacional

```yaml- Roles y permisos

LDAP_ORGANISATION: "Mi Empresa"

LDAP_DOMAIN: "ejemplo.com"### 3. **Gestión de Grupos**

LDAP_BASE_DN: "dc=ejemplo,dc=com"- Grupos de trabajo

LDAP_ADMIN_PASSWORD: "admin123"  # ⚠️ Cambiar en producción- Listas de distribución

```- Control de acceso basado en grupos



#### LdapNexus Web### 4. **Catálogo de Servicios**

```yaml- Directorio de aplicaciones

NODE_ENV: production- Servicios de red

PORT: 3000- Recursos compartidos

LDAP_URL: ldap://openldap:389

LDAP_BASE_DN: dc=ejemplo,dc=com## Ventajas de LDAP

SESSION_SECRET: "tu-secreto-aqui"  # ⚠️ Cambiar en producción

```✅ **Escalabilidad**: Maneja millones de entradas

✅ **Rendimiento**: Optimizado para lecturas

### Personalización✅ **Estándar**: Protocolo abierto e interoperable

✅ **Replicación**: Sincronización entre servidores

Para modificar la configuración de LDAP, edita el archivo `config/bootstrap.ldif` antes de iniciar los contenedores.✅ **Seguridad**: Soporte para cifrado y autenticación

✅ **Flexibilidad**: Schema extensible

## 📖 Uso

## Desventajas de LDAP

### Gestión de Usuarios

❌ **Complejidad**: Curva de aprendizaje pronunciada

1. **Crear Usuario**❌ **Escrituras lentas**: No optimizado para transacciones

   - Ve a "Usuarios" → "Agregar Usuario"❌ **Schema rígido**: Cambios de estructura complejos

   - Completa el formulario (validación en tiempo real)❌ **Herramientas**: Menos herramientas que bases de datos relacionales

   - El sistema sugiere username automáticamente

   - Confirma y el usuario se crea en LDAP## Arquitectura del Proyecto



2. **Editar Usuario**```

   - Busca el usuario en la listadocker-ldap/

   - Click en "Editar" (ícono lápiz)├── docker-compose.yml          # Configuración de contenedores

   - Modifica los campos necesarios├── .env                        # Variables de entorno

   - Guardar cambios├── config/

│   ├── bootstrap.ldif          # Datos iniciales

3. **Eliminar Usuario**│   ├── usuarios_adicionales.ldif

   - Click en "Eliminar" (ícono basura)│   └── certs/                  # Certificados SSL (opcional)

   - Confirma en el modal de seguridad├── scripts/

   - El usuario se elimina del directorio│   ├── buscar_usuarios.sh      # Scripts de ejemplo

│   ├── agregar_usuario.sh

### Búsqueda y Filtros│   └── autenticar_usuario.sh

├── data/

- **Búsqueda automática**: escribe y los resultados se filtran en tiempo real│   ├── ldap_data/              # Datos persistentes

- **Búsqueda por**: nombre, email, username, departamento│   └── ldap_config/            # Configuración persistente

- **Limpieza rápida**: botón para resetear filtros└── README.md                   # Esta documentación

```

### Dashboard

## Próximos Pasos

El dashboard muestra:

- **Total de usuarios** en el directorio1. **Iniciar el entorno**: `docker-compose up -d`

- **Total de grupos** configurados2. **Acceder a phpLDAPadmin**: http://localhost:8080

- **Distribución por departamento**3. **Ejecutar scripts de ejemplo**: Ver carpeta `scripts/`

- **Usuarios recientes** (últimos 5)4. **Integrar con aplicaciones**: Configurar autenticación LDAP

- **Estado de conexión** LDAP

## Referencias Útiles

## 🏗️ Arquitectura

- [RFC 4511 - LDAP Protocol](https://tools.ietf.org/html/rfc4511)

```- [OpenLDAP Documentation](https://www.openldap.org/doc/)

LdapNexus/- [LDAP Schema Reference](https://ldapwiki.com/wiki/LDAP%20Schema)

├── ldap-admin-web/          # Aplicación Node.js- [phpLDAPadmin Manual](http://phpldapadmin.sourceforge.net/wiki/index.php/Main_Page)
│   ├── src/
│   │   ├── app.js           # Punto de entrada
│   │   ├── routes/          # Rutas Express
│   │   ├── services/        # Lógica de negocio (LDAP)
│   │   ├── middleware/      # Seguridad y validaciones
│   │   └── config/          # Configuraciones
│   ├── views/               # Templates EJS
│   │   ├── layout.ejs       # Layout principal
│   │   ├── dashboard/       # Vistas del dashboard
│   │   └── auth/            # Vistas de autenticación
│   ├── public/              # Assets estáticos
│   │   ├── css/             # Bootstrap + estilos custom
│   │   └── js/              # Validaciones y utilidades
│   └── package.json
├── config/
│   └── bootstrap.ldif       # Datos iniciales LDAP
├── docker-compose.yml       # Orquestación completa
└── README.md
```

### Stack Tecnológico

**Backend:**
- Node.js 18+
- Express.js 4.x
- ldapjs (cliente LDAP)
- Express Session + CSRF
- Helmet.js (seguridad)
- Winston (logging)

**Frontend:**
- EJS (templates)
- Bootstrap 5
- Font Awesome
- Vanilla JavaScript (validaciones)

**Infraestructura:**
- Docker & Docker Compose
- OpenLDAP 1.5.0
- Alpine Linux (imagen base)

## 🔧 Desarrollo

### Modo Desarrollo

```bash
# Entrar al contenedor
docker exec -it ldap-nexus sh

# Ver logs en tiempo real
docker-compose logs -f ldap-admin-web

# Reiniciar servicio
docker-compose restart ldap-admin-web
```

### Testing LDAP

Conectar con cliente LDAP desde el contenedor de utilidades:

```bash
docker exec -it ldap-client bash

# Buscar todos los usuarios
ldapsearch -x -H ldap://openldap:389 \
  -D "cn=admin,dc=ejemplo,dc=com" \
  -w admin123 \
  -b "ou=people,dc=ejemplo,dc=com"

# Agregar usuario manualmente
ldapadd -x -H ldap://openldap:389 \
  -D "cn=admin,dc=ejemplo,dc=com" \
  -w admin123 \
  -f /scripts/add-user.ldif
```

### Estructura de Datos LDAP

```
dc=ejemplo,dc=com
├── ou=people                 # Usuarios
│   ├── cn=admin
│   ├── cn=juan.perez
│   └── cn=maria.garcia
└── ou=groups                 # Grupos
    ├── cn=admins
    ├── cn=developers
    └── cn=users
```

## 🐛 Troubleshooting

### Problema: No puedo conectar a LDAP

**Solución:**
```bash
# Verificar que el contenedor esté corriendo
docker ps | grep ldap-server

# Ver logs del servidor LDAP
docker logs ldap-server

# Probar conexión manualmente
docker exec ldap-client ldapsearch -x -H ldap://openldap:389 -b "dc=ejemplo,dc=com"
```

### Problema: Credenciales inválidas

**Solución:**
- Verifica las credenciales en `docker-compose.yml`
- Asegúrate de que coincidan con el `LDAP_ADMIN_DN` y `LDAP_ADMIN_PASSWORD`
- Reconstruye los contenedores si cambiaste variables:
  ```bash
  docker-compose down -v
  docker-compose up -d
  ```

### Problema: Puerto 3000 ya en uso

**Solución:**
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Usar puerto 3001 en host
```

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/t4ifi/LdapNexus/issues)
- **Discussions**: [GitHub Discussions](https://github.com/t4ifi/LdapNexus/discussions)

## 🙏 Agradecimientos

- [OpenLDAP](https://www.openldap.org/) por el servidor LDAP
- [osixia/docker-openldap](https://github.com/osixia/docker-openldap) por la imagen Docker
- [Bootstrap](https://getbootstrap.com/) por el framework CSS
- [Font Awesome](https://fontawesome.com/) por los iconos

## 🗺️ Roadmap

- [ ] Soporte para múltiples idiomas (i18n)
- [ ] Gestión avanzada de grupos
- [ ] Importación/exportación masiva (CSV/LDIF)
- [ ] Auditoría y logs de cambios
- [ ] Soporte para LDAPS (TLS/SSL)
- [ ] Panel de monitoreo en tiempo real
- [ ] API REST para integración
- [ ] Autenticación de dos factores (2FA)
- [ ] Temas dark/light mode
- [ ] Panel de configuración de políticas

---

Desarrollado con ❤️ por [t4ifi](https://github.com/t4ifi)

**⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub!**
