# Guía de Uso - Docker LDAP

## 🚀 Inicio Rápido

### 1. Prerrequisitos
```bash
# Verificar que Docker y Docker Compose estén instalados
docker --version
docker-compose --version

# Instalar herramientas LDAP (opcional, para usar scripts)
sudo apt-get update
sudo apt-get install ldap-utils
```

### 2. Levantar el Entorno
```bash
# Navegar al directorio del proyecto
cd /home/t4ifi/Andres/LDAP/docker-ldap

# Levantar los contenedores
docker-compose up -d

# Verificar que los contenedores estén corriendo
docker-compose ps
```

### 3. Verificar Instalación
```bash
# Verificar conexión LDAP
ldapsearch -x -H ldap://localhost:389 -b "dc=ejemplo,dc=com" -D "cn=admin,dc=ejemplo,dc=com" -w admin123

# Ver logs si hay problemas
docker-compose logs ldap-server
docker-compose logs ldap-admin
```

## 🌐 Acceso a Interfaces

### phpLDAPadmin (Interfaz Web)
- **URL**: http://localhost:8080
- **Usuario**: `cn=admin,dc=ejemplo,dc=com`
- **Contraseña**: `admin123`

### Servidor LDAP
- **Host**: `localhost`
- **Puerto LDAP**: `389`
- **Puerto LDAPS**: `636`
- **Base DN**: `dc=ejemplo,dc=com`

## 📋 Usando los Scripts

### Script de Búsqueda (`buscar_usuarios.sh`)
```bash
# Ejecutar menú interactivo
./scripts/buscar_usuarios.sh

# Buscar usuario específico
./scripts/buscar_usuarios.sh juan.perez
```

### Script de Autenticación (`autenticar_usuario.sh`)
```bash
# Menú interactivo
./scripts/autenticar_usuario.sh

# Autenticación directa
./scripts/autenticar_usuario.sh juan.perez password123
```

### Script para Agregar Usuarios (`agregar_usuario.sh`)
```bash
./scripts/agregar_usuario.sh
```

### Script de Administración (`admin_ldap.sh`)
```bash
./scripts/admin_ldap.sh
```

## 🛠️ Comandos LDAP Básicos

### Búsquedas
```bash
# Buscar todos los usuarios
ldapsearch -x -H ldap://localhost:389 -b "ou=people,dc=ejemplo,dc=com" -D "cn=admin,dc=ejemplo,dc=com" -w admin123

# Buscar usuario específico
ldapsearch -x -H ldap://localhost:389 -b "ou=people,dc=ejemplo,dc=com" -D "cn=admin,dc=ejemplo,dc=com" -w admin123 "(cn=juan.perez)"

# Buscar grupos
ldapsearch -x -H ldap://localhost:389 -b "ou=groups,dc=ejemplo,dc=com" -D "cn=admin,dc=ejemplo,dc=com" -w admin123

# Buscar por departamento
ldapsearch -x -H ldap://localhost:389 -b "ou=people,dc=ejemplo,dc=com" -D "cn=admin,dc=ejemplo,dc=com" -w admin123 "(departmentNumber=IT)"
```

### Agregar Entradas
```bash
# Agregar desde archivo LDIF
ldapadd -x -H ldap://localhost:389 -D "cn=admin,dc=ejemplo,dc=com" -w admin123 -f config/usuarios_adicionales.ldif
```

### Modificar Entradas
```bash
# Cambiar email de usuario
cat > cambio_email.ldif << EOF
dn: cn=juan.perez,ou=people,dc=ejemplo,dc=com
changetype: modify
replace: mail
mail: nuevo.email@ejemplo.com
EOF

ldapmodify -x -H ldap://localhost:389 -D "cn=admin,dc=ejemplo,dc=com" -w admin123 -f cambio_email.ldif
```

### Eliminar Entradas
```bash
# Eliminar usuario
ldapdelete -x -H ldap://localhost:389 -D "cn=admin,dc=ejemplo,dc=com" -w admin123 "cn=usuario.test,ou=people,dc=ejemplo,dc=com"
```

## 📊 Usuarios de Ejemplo Predefinidos

### Credenciales de Prueba
| Usuario | Contraseña | Departamento | Rol |
|---------|-----------|--------------|-----|
| juan.perez | password123 | IT | Desarrollador Senior |
| maria.garcia | password123 | HR | Analista de RRHH |
| carlos.rodriguez | password123 | Sales | Ejecutivo de Ventas |
| ana.martinez | password123 | IT | Admin de Sistemas |

### Grupos Disponibles
- `administrators`: Administradores del sistema
- `developers`: Desarrolladores
- `users`: Usuarios básicos

## 🔧 Integración con Aplicaciones

### Configuración Típica para Aplicaciones
```ini
# Configuración LDAP genérica
LDAP_HOST=localhost
LDAP_PORT=389
LDAP_BASE_DN=dc=ejemplo,dc=com
LDAP_BIND_DN=cn=admin,dc=ejemplo,dc=com
LDAP_BIND_PASSWORD=admin123
LDAP_USER_BASE=ou=people,dc=ejemplo,dc=com
LDAP_GROUP_BASE=ou=groups,dc=ejemplo,dc=com
LDAP_USER_FILTER=(objectClass=inetOrgPerson)
LDAP_USERNAME_ATTRIBUTE=cn
LDAP_EMAIL_ATTRIBUTE=mail
```

### Ejemplo de Autenticación en Python
```python
import ldap3

# Configuración del servidor
server = ldap3.Server('localhost', port=389)

# Autenticar usuario
def autenticar_usuario(username, password):
    user_dn = f"cn={username},ou=people,dc=ejemplo,dc=com"
    
    try:
        conn = ldap3.Connection(server, user_dn, password)
        if conn.bind():
            print(f"Autenticación exitosa para {username}")
            return True
        else:
            print(f"Autenticación fallida para {username}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

# Buscar información de usuario
def buscar_usuario(username):
    admin_dn = "cn=admin,dc=ejemplo,dc=com"
    admin_password = "admin123"
    
    conn = ldap3.Connection(server, admin_dn, admin_password)
    conn.bind()
    
    conn.search(
        'ou=people,dc=ejemplo,dc=com',
        f'(cn={username})',
        attributes=['cn', 'mail', 'title', 'departmentNumber']
    )
    
    return conn.entries

# Ejemplo de uso
if __name__ == "__main__":
    # Autenticar
    if autenticar_usuario('juan.perez', 'password123'):
        # Buscar información
        info = buscar_usuario('juan.perez')
        print(info)
```

## 🔒 Seguridad y Mejores Prácticas

### Configuración de Producción
1. **Cambiar contraseñas por defecto**
   ```bash
   # Editar .env
   LDAP_ADMIN_PASSWORD=contraseña_fuerte_aqui
   ```

2. **Habilitar SSL/TLS**
   - Generar certificados SSL
   - Configurar LDAPS en puerto 636
   - Forzar conexiones seguras

3. **Configurar ACLs (Access Control Lists)**
   - Restringir acceso de lectura/escritura
   - Implementar principio de menor privilegio

4. **Backup Regular**
   ```bash
   # Ejecutar script de backup
   ./scripts/admin_ldap.sh
   # Seleccionar opción 1
   ```

### Monitoreo
```bash
# Ver logs en tiempo real
docker logs -f ldap-server

# Monitorear conexiones
netstat -an | grep :389

# Estadísticas del directorio
./scripts/admin_ldap.sh
# Seleccionar opción 5
```

## 🚨 Troubleshooting

### Problemas Comunes

#### 1. Error de Conexión
```bash
# Verificar que el contenedor esté corriendo
docker-compose ps

# Verificar puertos
netstat -tlnp | grep :389
```

#### 2. Autenticación Fallida
```bash
# Verificar credenciales de admin
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=ejemplo,dc=com" -w admin123 -b "dc=ejemplo,dc=com"

# Verificar estructura del directorio
ldapsearch -x -H ldap://localhost:389 -D "cn=admin,dc=ejemplo,dc=com" -w admin123 -b "dc=ejemplo,dc=com" "(objectClass=*)"
```

#### 3. Datos No Inicializados
```bash
# Reiniciar contenedores limpiando volúmenes
docker-compose down -v
docker-compose up -d
```

#### 4. phpLDAPadmin No Accesible
```bash
# Verificar logs
docker logs ldap-admin

# Verificar puerto
curl -I http://localhost:8080
```

## 📚 Recursos Adicionales

### Documentación
- [OpenLDAP Admin Guide](https://www.openldap.org/doc/admin24/)
- [RFC 4511 - LDAP Protocol](https://tools.ietf.org/html/rfc4511)
- [LDAP Schema Reference](https://ldapwiki.com/wiki/LDAP%20Schema)

### Herramientas Útiles
- **Apache Directory Studio**: Cliente LDAP gráfico
- **ldapadmin**: Herramienta de administración web
- **phpLDAPadmin**: Interfaz web incluida
- **JXplorer**: Cliente LDAP multiplataforma

### Extensiones y Plugins
- **LDAP Auth para Nginx**: Autenticación web
- **PAM LDAP**: Autenticación del sistema
- **SSSD**: System Security Services Daemon
- **FreeRADIUS**: Servidor RADIUS con backend LDAP

## 📞 Soporte

Para problemas o preguntas:
1. Revisar logs: `docker-compose logs`
2. Verificar configuración: `docker-compose config`
3. Consultar documentación oficial de OpenLDAP
4. Revisar issues en repositorios oficiales

---

**¡Listo para usar LDAP!** 🎉

Recuerda siempre hacer backups antes de realizar cambios importantes en producción.