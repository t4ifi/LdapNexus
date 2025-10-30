#!/bin/bash

# LdapNexus - Script de Inicialización
# Este script configura y ejecuta LdapNexus por primera vez

set -e

echo "🌐 LdapNexus - Inicialización"
echo "================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Docker
echo -e "${BLUE}📦 Verificando Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado. Por favor instala Docker primero.${NC}"
    echo "   Visita: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker encontrado: $(docker --version)${NC}"

# Verificar Docker Compose
echo -e "${BLUE}📦 Verificando Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose encontrado${NC}"

# Crear directorios necesarios
echo -e "${BLUE}📁 Creando directorios...${NC}"
mkdir -p data/ldap_data
mkdir -p data/ldap_config
mkdir -p config/certs
mkdir -p ldap-admin-web/logs

# Dar permisos apropiados
chmod 755 data/ldap_data
chmod 755 data/ldap_config

echo -e "${GREEN}✅ Directorios creados${NC}"

# Verificar si hay contenedores corriendo
echo -e "${BLUE}🔍 Verificando contenedores existentes...${NC}"
if docker ps -a | grep -q ldap-nexus || docker ps -a | grep -q ldap-server; then
    echo -e "${YELLOW}⚠️  Contenedores existentes encontrados.${NC}"
    read -p "¿Deseas eliminarlos y empezar de cero? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🗑️  Eliminando contenedores anteriores...${NC}"
        docker compose down -v
        echo -e "${GREEN}✅ Contenedores eliminados${NC}"
    fi
fi

# Construir imágenes
echo -e "${BLUE}🔨 Construyendo imágenes Docker...${NC}"
docker compose build

# Iniciar servicios
echo -e "${BLUE}🚀 Iniciando servicios...${NC}"
docker compose up -d

# Esperar a que los servicios estén listos
echo -e "${BLUE}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 10

# Verificar estado
echo -e "${BLUE}🔍 Verificando estado de servicios...${NC}"
docker compose ps

# Verificar salud de la aplicación
echo ""
echo -e "${BLUE}🏥 Verificando salud de la aplicación...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Aplicación está funcionando correctamente!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  La aplicación está tardando en iniciar. Verifica los logs:${NC}"
        echo "   docker-compose logs -f ldap-admin-web"
    else
        echo -n "."
        sleep 2
    fi
done

# Mostrar información de acceso
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ ¡LdapNexus está listo!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${BLUE}📍 Acceso:${NC}"
echo "   URL: http://localhost:3000"
echo ""
echo -e "${BLUE}🔑 Credenciales por defecto:${NC}"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   Cambia las credenciales por defecto en producción!"
echo ""
echo -e "${BLUE}📚 Comandos útiles:${NC}"
echo "   Ver logs:        docker-compose logs -f"
echo "   Detener:         docker-compose stop"
echo "   Reiniciar:       docker-compose restart"
echo "   Eliminar todo:   docker-compose down -v"
echo ""
echo -e "${GREEN}🎉 ¡Disfruta usando LdapNexus!${NC}"
echo ""
