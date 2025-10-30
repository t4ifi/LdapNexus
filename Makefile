# Makefile para Docker LDAP
# Comandos simplificados para gestión del entorno LDAP

.PHONY: help up down restart logs status backup clean install test

# Configuración
COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = docker-ldap

# Ayuda
help:
	@echo "🚀 Docker LDAP - Comandos Disponibles"
	@echo "===================================="
	@echo ""
	@echo "📦 Gestión de Contenedores:"
	@echo "  make up        - Levantar el entorno LDAP"
	@echo "  make down      - Detener el entorno LDAP"
	@echo "  make restart   - Reiniciar el entorno LDAP"
	@echo "  make status    - Ver estado de contenedores"
	@echo "  make logs      - Ver logs en tiempo real"
	@echo ""
	@echo "🔧 Administración:"
	@echo "  make backup    - Crear backup del directorio LDAP"
	@echo "  make clean     - Limpiar volúmenes y datos"
	@echo "  make install   - Instalar herramientas LDAP"
	@echo "  make test      - Probar conectividad LDAP"
	@echo ""
	@echo "📋 Scripts:"
	@echo "  make search    - Buscar usuarios"
	@echo "  make auth      - Probar autenticación"
	@echo "  make add-user  - Agregar nuevo usuario"
	@echo "  make admin     - Panel de administración"
	@echo ""
	@echo "🌐 Acceso Web:"
	@echo "  phpLDAPadmin: http://localhost:8080"
	@echo "  Usuario: cn=admin,dc=ejemplo,dc=com"
	@echo "  Contraseña: admin123"

# Levantar entorno
up:
	@echo "🚀 Levantando entorno LDAP..."
	docker-compose up -d
	@echo "✅ Entorno levantado"
	@echo "🌐 phpLDAPadmin: http://localhost:8080"
	@echo "📋 Estado: make status"

# Detener entorno
down:
	@echo "⏹️  Deteniendo entorno LDAP..."
	docker-compose down
	@echo "✅ Entorno detenido"

# Reiniciar entorno
restart:
	@echo "🔄 Reiniciando entorno LDAP..."
	docker-compose restart
	@echo "✅ Entorno reiniciado"

# Ver estado
status:
	@echo "📊 Estado de contenedores:"
	@docker-compose ps
	@echo ""
	@echo "🌐 Servicios disponibles:"
	@echo "  - LDAP Server: localhost:389"
	@echo "  - LDAPS Server: localhost:636"
	@echo "  - phpLDAPadmin: http://localhost:8080"

# Ver logs
logs:
	@echo "📋 Logs del entorno LDAP (Ctrl+C para salir):"
	docker-compose logs -f

# Ver logs específicos
logs-ldap:
	docker-compose logs -f openldap

logs-admin:
	docker-compose logs -f phpldapadmin

# Crear backup
backup:
	@echo "💾 Creando backup..."
	./scripts/admin_ldap.sh

# Limpiar todo (¡CUIDADO!)
clean:
	@echo "⚠️  ADVERTENCIA: Esto eliminará todos los datos"
	@echo "¿Está seguro? [y/N]" && read ans && [ $${ans:-N} = y ]
	@echo "🗑️  Limpiando entorno..."
	docker-compose down -v
	docker-compose rm -f
	sudo rm -rf data/ldap_data/* data/ldap_config/*
	@echo "✅ Limpieza completada"

# Instalar herramientas LDAP
install:
	@echo "📦 Instalando herramientas LDAP..."
	@if command -v apt-get > /dev/null; then \
		sudo apt-get update && sudo apt-get install -y ldap-utils; \
	elif command -v yum > /dev/null; then \
		sudo yum install -y openldap-clients; \
	elif command -v brew > /dev/null; then \
		brew install openldap; \
	else \
		echo "❌ No se pudo detectar el gestor de paquetes"; \
		exit 1; \
	fi
	@echo "✅ Herramientas LDAP instaladas"

# Probar conectividad
test:
	@echo "🔍 Probando conectividad LDAP..."
	@if ldapsearch -x -H ldap://localhost:389 -b "dc=ejemplo,dc=com" -D "cn=admin,dc=ejemplo,dc=com" -w admin123 > /dev/null 2>&1; then \
		echo "✅ Conectividad LDAP: OK"; \
	else \
		echo "❌ Conectividad LDAP: FALLO"; \
		echo "💡 Verifique que el entorno esté levantado: make status"; \
		exit 1; \
	fi
	@if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then \
		echo "✅ phpLDAPadmin: OK"; \
	else \
		echo "❌ phpLDAPadmin: FALLO"; \
	fi

# Ejecutar scripts
search:
	@./scripts/buscar_usuarios.sh

auth:
	@./scripts/autenticar_usuario.sh

add-user:
	@./scripts/agregar_usuario.sh

admin:
	@./scripts/admin_ldap.sh

# Inicialización completa
init: up
	@echo "⏳ Esperando que el servidor LDAP esté listo..."
	@sleep 10
	@make test
	@echo ""
	@echo "🎉 Entorno LDAP inicializado correctamente"
	@echo ""
	@echo "📋 Usuarios de prueba disponibles:"
	@echo "  - juan.perez (password: password123)"
	@echo "  - maria.garcia (password: password123)"
	@echo "  - carlos.rodriguez (password: password123)"
	@echo "  - ana.martinez (password: password123)"
	@echo ""
	@echo "🌐 Acceso web: http://localhost:8080"
	@echo "👤 Admin: cn=admin,dc=ejemplo,dc=com / admin123"

# Agregar datos de ejemplo adicionales
seed:
	@echo "🌱 Agregando datos de ejemplo adicionales..."
	@sleep 5  # Esperar que LDAP esté listo
	@if ldapadd -x -H ldap://localhost:389 -D "cn=admin,dc=ejemplo,dc=com" -w admin123 -f config/usuarios_adicionales.ldif; then \
		echo "✅ Datos adicionales agregados"; \
	else \
		echo "⚠️  Los datos adicionales ya existen o hubo un error"; \
	fi

# Mostrar información del entorno
info:
	@echo "ℹ️  Información del Entorno LDAP"
	@echo "==============================="
	@echo "📁 Directorio: $(PWD)"
	@echo "🐳 Proyecto Docker: $(PROJECT_NAME)"
	@echo "📄 Compose File: $(COMPOSE_FILE)"
	@echo ""
	@echo "🔧 Configuración:"
	@echo "  - Dominio: ejemplo.com"
	@echo "  - Base DN: dc=ejemplo,dc=com"
	@echo "  - Admin DN: cn=admin,dc=ejemplo,dc=com"
	@echo ""
	@echo "📂 Estructura del directorio:"
	@echo "  - ou=people,dc=ejemplo,dc=com (usuarios)"
	@echo "  - ou=groups,dc=ejemplo,dc=com (grupos)"
	@echo "  - ou=departments,dc=ejemplo,dc=com (departamentos)"

# Reinicio completo con limpieza
reset: clean init
	@echo "🔄 Reinicio completo del entorno LDAP completado"

# Compilar y levantar aplicación web
build-web:
	@echo "🔨 Compilando aplicación web LDAP..."
	cd ldap-admin-web && npm install
	docker-compose build ldap-admin-web
	@echo "✅ Aplicación web compilada"

# Levantar solo servicios básicos (sin app web)
up-basic:
	@echo "🚀 Levantando servicios básicos LDAP..."
	docker-compose up -d openldap phpldapadmin ldap-utils
	@echo "✅ Servicios básicos levantados"

# Levantar todo incluyendo aplicación web
up-full: build-web
	@echo "🚀 Levantando entorno completo LDAP..."
	docker-compose up -d
	@echo "✅ Entorno completo levantado"
	@echo "🌐 phpLDAPadmin: http://localhost:8080"
	@echo "🖥️  App Web: http://localhost:3000"

# Ver logs de la aplicación web
logs-web:
	docker-compose logs -f ldap-admin-web

# Entrar al contenedor de la aplicación web
shell-web:
	docker-compose exec ldap-admin-web sh

# Instalar dependencias de la app web
install-web:
	@echo "📦 Instalando dependencias de la aplicación web..."
	cd ldap-admin-web && npm install
	@echo "✅ Dependencias instaladas"