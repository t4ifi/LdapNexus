#!/bin/bash

# Script para buscar usuarios en LDAP
# Uso: ./buscar_usuarios.sh [filtro_opcional]

# Configuración del servidor LDAP
LDAP_HOST="localhost"
LDAP_PORT="389"
BASE_DN="dc=ejemplo,dc=com"
BIND_DN="cn=admin,dc=ejemplo,dc=com"
BIND_PASSWORD="admin123"

echo "=== BUSCADOR DE USUARIOS LDAP ==="
echo ""

# Función para buscar todos los usuarios
buscar_todos_usuarios() {
    echo "📋 Buscando todos los usuarios..."
    ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "${BIND_DN}" -w "${BIND_PASSWORD}" \
        -b "ou=people,${BASE_DN}" \
        "(objectClass=inetOrgPerson)" \
        cn sn givenName mail title departmentNumber
}

# Función para buscar usuario específico
buscar_usuario_especifico() {
    local usuario=$1
    echo "🔍 Buscando usuario: $usuario"
    ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "${BIND_DN}" -w "${BIND_PASSWORD}" \
        -b "ou=people,${BASE_DN}" \
        "(|(cn=*${usuario}*)(uid=*${usuario}*)(mail=*${usuario}*))" \
        cn sn givenName mail title departmentNumber telephoneNumber
}

# Función para buscar por departamento
buscar_por_departamento() {
    local departamento=$1
    echo "🏢 Buscando usuarios del departamento: $departamento"
    ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "${BIND_DN}" -w "${BIND_PASSWORD}" \
        -b "ou=people,${BASE_DN}" \
        "(departmentNumber=${departamento})" \
        cn sn givenName mail title departmentNumber
}

# Función para listar grupos
listar_grupos() {
    echo "👥 Listando todos los grupos..."
    ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "${BIND_DN}" -w "${BIND_PASSWORD}" \
        -b "ou=groups,${BASE_DN}" \
        "(objectClass=groupOfNames)" \
        cn description member
}

# Función para buscar miembros de un grupo
buscar_miembros_grupo() {
    local grupo=$1
    echo "👤 Buscando miembros del grupo: $grupo"
    ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "${BIND_DN}" -w "${BIND_PASSWORD}" \
        -b "ou=groups,${BASE_DN}" \
        "(cn=${grupo})" \
        member
}

# Menú interactivo
if [ $# -eq 0 ]; then
    echo "Seleccione una opción:"
    echo "1) Buscar todos los usuarios"
    echo "2) Buscar usuario específico"
    echo "3) Buscar por departamento"
    echo "4) Listar grupos"
    echo "5) Buscar miembros de un grupo"
    echo ""
    read -p "Opción: " opcion
    
    case $opcion in
        1)
            buscar_todos_usuarios
            ;;
        2)
            read -p "Ingrese nombre de usuario o parte del nombre: " usuario
            buscar_usuario_especifico "$usuario"
            ;;
        3)
            echo "Departamentos disponibles: IT, HR, Sales"
            read -p "Ingrese departamento: " departamento
            buscar_por_departamento "$departamento"
            ;;
        4)
            listar_grupos
            ;;
        5)
            read -p "Ingrese nombre del grupo: " grupo
            buscar_miembros_grupo "$grupo"
            ;;
        *)
            echo "Opción no válida"
            exit 1
            ;;
    esac
else
    # Si se proporciona un argumento, buscar usuario específico
    buscar_usuario_especifico "$1"
fi

echo ""
echo "✅ Búsqueda completada"