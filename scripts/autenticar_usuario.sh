#!/bin/bash

# Script para autenticar usuarios en LDAP
# Uso: ./autenticar_usuario.sh [usuario] [contraseña]

# Configuración del servidor LDAP
LDAP_HOST="localhost"
LDAP_PORT="389"
BASE_DN="dc=ejemplo,dc=com"

echo "=== AUTENTICACIÓN LDAP ==="
echo ""

# Función para autenticar usuario
autenticar_usuario() {
    local usuario=$1
    local password=$2
    
    # Construir DN del usuario
    local user_dn="cn=${usuario},ou=people,${BASE_DN}"
    
    echo "🔐 Intentando autenticar usuario: $usuario"
    echo "DN: $user_dn"
    
    # Intentar bind con las credenciales del usuario
    if ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$user_dn" -w "$password" \
        -b "$user_dn" \
        "(objectClass=*)" > /dev/null 2>&1; then
        
        echo "✅ Autenticación EXITOSA para $usuario"
        
        # Obtener información del usuario autenticado
        echo ""
        echo "📋 Información del usuario:"
        ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
            -D "$user_dn" -w "$password" \
            -b "$user_dn" \
            "(objectClass=*)" \
            cn sn givenName mail title departmentNumber telephoneNumber
            
        return 0
    else
        echo "❌ Autenticación FALLIDA para $usuario"
        echo "Verifique el nombre de usuario y contraseña"
        return 1
    fi
}

# Función para verificar si un usuario existe
verificar_usuario_existe() {
    local usuario=$1
    local admin_dn="cn=admin,${BASE_DN}"
    local admin_password="admin123"
    
    echo "🔍 Verificando si el usuario existe: $usuario"
    
    if ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$admin_dn" -w "$admin_password" \
        -b "ou=people,${BASE_DN}" \
        "(cn=${usuario})" cn > /dev/null 2>&1; then
        echo "✅ El usuario $usuario existe en LDAP"
        return 0
    else
        echo "❌ El usuario $usuario NO existe en LDAP"
        return 1
    fi
}

# Función para mostrar usuarios disponibles
mostrar_usuarios_disponibles() {
    local admin_dn="cn=admin,${BASE_DN}"
    local admin_password="admin123"
    
    echo "📋 Usuarios disponibles en el sistema:"
    ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$admin_dn" -w "$admin_password" \
        -b "ou=people,${BASE_DN}" \
        "(objectClass=inetOrgPerson)" \
        cn | grep "cn:" | sed 's/cn: /- /'
}

# Función para cambiar contraseña (requiere contraseña actual)
cambiar_contraseña() {
    local usuario=$1
    local password_actual=$2
    local password_nueva=$3
    
    local user_dn="cn=${usuario},ou=people,${BASE_DN}"
    
    echo "🔑 Cambiando contraseña para usuario: $usuario"
    
    # Primero verificar que la contraseña actual sea correcta
    if ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$user_dn" -w "$password_actual" \
        -b "$user_dn" "(objectClass=*)" > /dev/null 2>&1; then
        
        # Crear archivo temporal con el cambio
        local temp_file=$(mktemp)
        cat > "$temp_file" << EOF
dn: $user_dn
changetype: modify
replace: userPassword
userPassword: $password_nueva
EOF
        
        # Ejecutar el cambio
        if ldapmodify -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
            -D "$user_dn" -w "$password_actual" \
            -f "$temp_file" > /dev/null 2>&1; then
            echo "✅ Contraseña cambiada exitosamente"
        else
            echo "❌ Error al cambiar la contraseña"
        fi
        
        rm -f "$temp_file"
    else
        echo "❌ Contraseña actual incorrecta"
        return 1
    fi
}

# Menú interactivo si no se proporcionan argumentos
if [ $# -eq 0 ]; then
    echo "Seleccione una opción:"
    echo "1) Autenticar usuario"
    echo "2) Verificar si usuario existe"
    echo "3) Mostrar usuarios disponibles"
    echo "4) Cambiar contraseña"
    echo ""
    read -p "Opción: " opcion
    
    case $opcion in
        1)
            read -p "Usuario: " usuario
            read -s -p "Contraseña: " password
            echo ""
            autenticar_usuario "$usuario" "$password"
            ;;
        2)
            read -p "Usuario a verificar: " usuario
            verificar_usuario_existe "$usuario"
            ;;
        3)
            mostrar_usuarios_disponibles
            ;;
        4)
            read -p "Usuario: " usuario
            read -s -p "Contraseña actual: " password_actual
            echo ""
            read -s -p "Contraseña nueva: " password_nueva
            echo ""
            cambiar_contraseña "$usuario" "$password_actual" "$password_nueva"
            ;;
        *)
            echo "Opción no válida"
            exit 1
            ;;
    esac
elif [ $# -eq 2 ]; then
    # Si se proporcionan usuario y contraseña como argumentos
    autenticar_usuario "$1" "$2"
else
    echo "Uso: $0 [usuario] [contraseña]"
    echo "O ejecute sin argumentos para usar el menú interactivo"
    exit 1
fi

echo ""
echo "=== Fin de la operación ==="