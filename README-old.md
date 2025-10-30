# Docker LDAP - Guía Completa

## ¿Qué es LDAP?

**LDAP (Lightweight Directory Access Protocol)** es un protocolo de aplicación abierto y estándar para acceder y mantener servicios de información de directorio distribuidos sobre una red de protocolo de Internet.

### Conceptos Fundamentales

#### 1. **Directorio vs Base de Datos**
- **Directorio**: Optimizado for lectura, estructura jerárquica, información relativamente estática
- **Base de Datos**: Optimizada para escritura/lectura, estructura relacional, transacciones ACID

#### 2. **Estructura Jerárquica (DIT - Directory Information Tree)**
```
dc=ejemplo,dc=com (raíz del dominio)
├── ou=people (usuarios)
│   ├── cn=juan.perez
│   ├── cn=maria.garcia
│   └── cn=carlos.rodriguez
├── ou=groups (grupos)
│   ├── cn=administrators
│   ├── cn=developers
│   └── cn=users
└── ou=departments (departamentos)
    ├── ou=IT
    ├── ou=HR
    └── ou=Sales
```

#### 3. **Componentes de DN (Distinguished Name)**
- **DN**: Nombre único que identifica una entrada (ej: `cn=juan.perez,ou=people,dc=ejemplo,dc=com`)
- **RDN**: Componente relativo del DN (ej: `cn=juan.perez`)
- **DC**: Domain Component (ej: `dc=ejemplo`, `dc=com`)
- **CN**: Common Name (ej: `cn=juan.perez`)
- **OU**: Organizational Unit (ej: `ou=people`)
- **O**: Organization (ej: `o=Mi Empresa`)

#### 4. **ObjectClass y Atributos**
- **ObjectClass**: Define el tipo de objeto y qué atributos puede tener
  - `inetOrgPerson`: Persona con atributos de internet (email, teléfono)
  - `organizationalUnit`: Unidad organizacional
  - `groupOfNames`: Grupo que contiene miembros
  - `posixAccount`: Cuenta UNIX/Linux

- **Atributos comunes**:
  - `cn` (Common Name): Nombre común
  - `sn` (Surname): Apellido
  - `givenName`: Nombre de pila
  - `mail`: Correo electrónico
  - `uid`: ID de usuario único
  - `userPassword`: Contraseña del usuario

## Cómo Funciona LDAP

### 1. **Modelo de Información**
- Los datos se almacenan en una estructura de árbol jerárquica
- Cada nodo del árbol es una entrada con atributos
- Las entradas se identifican únicamente por su DN

### 2. **Modelo de Nombres**
- Cada entrada tiene un DN (Distinguished Name) único
- El DN se forma concatenando RDNs desde la entrada hasta la raíz

### 3. **Modelo Funcional**
LDAP define operaciones para:
- **Bind**: Autenticación
- **Search**: Búsqueda de entradas
- **Add**: Agregar nuevas entradas
- **Modify**: Modificar entradas existentes
- **Delete**: Eliminar entradas
- **ModifyDN**: Cambiar el DN de una entrada

### 4. **Modelo de Seguridad**
- **Autenticación**: Verificar identidad (bind)
- **Autorización**: Controlar acceso a recursos (ACL)
- **Cifrado**: TLS/SSL para proteger datos en tránsito

## Casos de Uso Comunes

### 1. **Autenticación Centralizada**
- Single Sign-On (SSO)
- Autenticación de aplicaciones web
- Login de sistemas operativos

### 2. **Directorio de Empleados**
- Información de contacto
- Estructura organizacional
- Roles y permisos

### 3. **Gestión de Grupos**
- Grupos de trabajo
- Listas de distribución
- Control de acceso basado en grupos

### 4. **Catálogo de Servicios**
- Directorio de aplicaciones
- Servicios de red
- Recursos compartidos

## Ventajas de LDAP

✅ **Escalabilidad**: Maneja millones de entradas
✅ **Rendimiento**: Optimizado para lecturas
✅ **Estándar**: Protocolo abierto e interoperable
✅ **Replicación**: Sincronización entre servidores
✅ **Seguridad**: Soporte para cifrado y autenticación
✅ **Flexibilidad**: Schema extensible

## Desventajas de LDAP

❌ **Complejidad**: Curva de aprendizaje pronunciada
❌ **Escrituras lentas**: No optimizado para transacciones
❌ **Schema rígido**: Cambios de estructura complejos
❌ **Herramientas**: Menos herramientas que bases de datos relacionales

## Arquitectura del Proyecto

```
docker-ldap/
├── docker-compose.yml          # Configuración de contenedores
├── .env                        # Variables de entorno
├── config/
│   ├── bootstrap.ldif          # Datos iniciales
│   ├── usuarios_adicionales.ldif
│   └── certs/                  # Certificados SSL (opcional)
├── scripts/
│   ├── buscar_usuarios.sh      # Scripts de ejemplo
│   ├── agregar_usuario.sh
│   └── autenticar_usuario.sh
├── data/
│   ├── ldap_data/              # Datos persistentes
│   └── ldap_config/            # Configuración persistente
└── README.md                   # Esta documentación
```

## Próximos Pasos

1. **Iniciar el entorno**: `docker-compose up -d`
2. **Acceder a phpLDAPadmin**: http://localhost:8080
3. **Ejecutar scripts de ejemplo**: Ver carpeta `scripts/`
4. **Integrar con aplicaciones**: Configurar autenticación LDAP

## Referencias Útiles

- [RFC 4511 - LDAP Protocol](https://tools.ietf.org/html/rfc4511)
- [OpenLDAP Documentation](https://www.openldap.org/doc/)
- [LDAP Schema Reference](https://ldapwiki.com/wiki/LDAP%20Schema)
- [phpLDAPadmin Manual](http://phpldapadmin.sourceforge.net/wiki/index.php/Main_Page)