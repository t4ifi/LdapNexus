# ESTRUCTURA DEL PROYECTO

```
docker-ldap/
├── README.md                    # Documentación principal sobre LDAP
├── GUIA_USO.md                 # Guía completa de uso
├── docker-compose.yml          # Configuración de contenedores Docker
├── .env                        # Variables de entorno
├── Makefile                    # Comandos simplificados
├── config/                     # Archivos de configuración LDAP
│   ├── bootstrap.ldif          # Datos iniciales del directorio
│   ├── usuarios_adicionales.ldif # Usuarios adicionales
│   └── certs/                 # Certificados SSL (se crean automáticamente)
├── scripts/                   # Scripts de administración
│   ├── buscar_usuarios.sh     # Buscar y listar usuarios
│   ├── autenticar_usuario.sh  # Probar autenticación
│   ├── agregar_usuario.sh     # Agregar nuevos usuarios
│   └── admin_ldap.sh          # Panel de administración
└── data/                      # Datos persistentes (se crean automáticamente)
    ├── ldap_data/            # Base de datos LDAP
    └── ldap_config/          # Configuración de OpenLDAP
```

## ARCHIVOS CREADOS

✅ **docker-compose.yml** - Configuración completa con OpenLDAP y phpLDAPadmin
✅ **.env** - Variables de entorno configurables
✅ **README.md** - Explicación completa de LDAP y conceptos
✅ **GUIA_USO.md** - Guía práctica de uso paso a paso
✅ **Makefile** - Comandos simplificados para gestión
✅ **config/bootstrap.ldif** - Estructura inicial con usuarios y grupos
✅ **config/usuarios_adicionales.ldif** - Usuarios adicionales de ejemplo
✅ **scripts/buscar_usuarios.sh** - Script para búsquedas LDAP
✅ **scripts/autenticar_usuario.sh** - Script para autenticación
✅ **scripts/agregar_usuario.sh** - Script para agregar usuarios
✅ **scripts/admin_ldap.sh** - Script de administración general

## CONTENEDORES INCLUIDOS

🐳 **openldap** (osixia/openldap:1.5.0)
   - Puerto 389 (LDAP)
   - Puerto 636 (LDAPS)
   - Configuración automática
   - Datos persistentes

🐳 **phpldapadmin** (osixia/phpldapadmin:latest)
   - Puerto 8080 (Web UI)
   - Interfaz gráfica para administración
   - Conectado automáticamente a OpenLDAP

🐳 **ldap-utils** (debian:bullseye-slim)
   - Herramientas de línea de comandos
   - Para ejecutar scripts desde contenedor

## USUARIOS DE EJEMPLO

👤 **juan.perez** - Desarrollador Senior (IT)
👤 **maria.garcia** - Analista de RRHH (HR)  
👤 **carlos.rodriguez** - Ejecutivo de Ventas (Sales)
👤 **ana.martinez** - Admin de Sistemas (IT)

📧 Contraseña para todos: `password123`

## COMANDOS RÁPIDOS

```bash
# Levantar entorno
make up

# Ver estado
make status

# Probar conectividad
make test

# Buscar usuarios
make search

# Acceso web
# http://localhost:8080
```

¡El entorno Docker LDAP está listo para usar! 🎉