#!/bin/bash

# Script para agregar usuarios a LDAP
# Uso: ./agregar_usuario.sh

# Configuración del servidor LDAP
LDAP_HOST="localhost"
LDAP_PORT="389"
BASE_DN="dc=ejemplo,dc=com"
ADMIN_DN="cn=admin,dc=ejemplo,dc=com"
ADMIN_PASSWORD="admin123"

echo "=== AGREGAR USUARIO A LDAP ==="
echo ""

# Función para generar UID y GID únicos
generar_uid() {
    local admin_dn="$ADMIN_DN"
    local admin_password="$ADMIN_PASSWORD"
    
    # Buscar el UID más alto existente
    local max_uid=$(ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$admin_dn" -w "$admin_password" \
        -b "ou=people,${BASE_DN}" \
        "(objectClass=posixAccount)" \
        uidNumber | grep "uidNumber:" | awk '{print $2}' | sort -n | tail -1)
    
    if [ -z "$max_uid" ]; then
        echo "10001"  # UID inicial si no hay usuarios
    else
        echo $((max_uid + 1))
    fi
}

# Función para validar email
validar_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Función para cifrar contraseña
cifrar_contraseña() {
    local password=$1
    # Usar slappasswd si está disponible, sino usar un hash simple
    if command -v slappasswd > /dev/null; then
        slappasswd -s "$password"
    else
        # Fallback: usar openssl para generar hash
        echo -n "$password" | openssl dgst -sha1 -binary | openssl base64
    fi
}

# Función para agregar usuario
agregar_usuario() {
    local cn=$1
    local nombre=$2
    local apellido=$3
    local email=$4
    local telefono=$5
    local titulo=$6
    local departamento=$7
    local empleado_num=$8
    local password=$9
    
    # Generar UID único
    local uid_number=$(generar_uid)
    local gid_number=$uid_number
    
    # Crear DN del usuario
    local user_dn="cn=${cn},ou=people,${BASE_DN}"
    
    # Cifrar contraseña
    local encrypted_password=$(cifrar_contraseña "$password")
    
    echo "📝 Creando usuario con los siguientes datos:"
    echo "  DN: $user_dn"
    echo "  Nombre: $nombre $apellido"
    echo "  Email: $email"
    echo "  UID: $uid_number"
    echo ""
    
    # Crear archivo LDIF temporal
    local temp_file=$(mktemp)
    cat > "$temp_file" << EOF
dn: $user_dn
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
cn: $cn
sn: $apellido
givenName: $nombre
displayName: $nombre $apellido
uid: $cn
uidNumber: $uid_number
gidNumber: $gid_number
homeDirectory: /home/$cn
loginShell: /bin/bash
mail: $email
telephoneNumber: $telefono
title: $titulo
departmentNumber: $departamento
employeeNumber: $empleado_num
userPassword: $encrypted_password
EOF
    
    # Agregar usuario a LDAP
    if ldapadd -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -f "$temp_file"; then
        
        echo "✅ Usuario $cn agregado exitosamente"
        
        # Preguntar si agregar a algún grupo
        echo ""
        read -p "¿Desea agregar el usuario a algún grupo? (s/n): " agregar_grupo
        
        if [[ $agregar_grupo == "s" || $agregar_grupo == "S" ]]; then
            listar_grupos_disponibles
            read -p "Ingrese el nombre del grupo: " grupo
            agregar_usuario_a_grupo "$cn" "$grupo"
        fi
        
    else
        echo "❌ Error al agregar usuario $cn"
    fi
    
    # Limpiar archivo temporal
    rm -f "$temp_file"
}

# Función para listar grupos disponibles
listar_grupos_disponibles() {
    echo "📋 Grupos disponibles:"
    ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "ou=groups,${BASE_DN}" \
        "(objectClass=groupOfNames)" \
        cn description | grep -E "^cn:|^description:" | \
        awk 'BEGIN{RS=""; FS="\n"} {gsub(/cn: /, "- "); gsub(/description: /, "  "); print}'
}

# Función para agregar usuario a un grupo
agregar_usuario_a_grupo() {
    local usuario=$1
    local grupo=$2
    
    local user_dn="cn=${usuario},ou=people,${BASE_DN}"
    local group_dn="cn=${grupo},ou=groups,${BASE_DN}"
    
    echo "👥 Agregando $usuario al grupo $grupo..."
    
    # Crear archivo LDIF para agregar miembro
    local temp_file=$(mktemp)
    cat > "$temp_file" << EOF
dn: $group_dn
changetype: modify
add: member
member: $user_dn
EOF
    
    if ldapmodify -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -f "$temp_file"; then
        echo "✅ Usuario agregado al grupo exitosamente"
    else
        echo "❌ Error al agregar usuario al grupo"
    fi
    
    rm -f "$temp_file"
}

# Función para crear un nuevo grupo
crear_grupo() {
    local nombre_grupo=$1
    local descripcion=$2
    
    local group_dn="cn=${nombre_grupo},ou=groups,${BASE_DN}"
    
    echo "👥 Creando grupo: $nombre_grupo"
    
    # Crear archivo LDIF temporal
    local temp_file=$(mktemp)
    cat > "$temp_file" << EOF
dn: $group_dn
objectClass: groupOfNames
cn: $nombre_grupo
description: $descripcion
member: cn=admin,$BASE_DN
EOF
    
    if ldapadd -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -f "$temp_file"; then
        echo "✅ Grupo $nombre_grupo creado exitosamente"
    else
        echo "❌ Error al crear grupo $nombre_grupo"
    fi
    
    rm -f "$temp_file"
}

# Menú principal
echo "Seleccione una opción:"
echo "1) Agregar nuevo usuario"
echo "2) Crear nuevo grupo"
echo "3) Listar grupos existentes"
echo ""
read -p "Opción: " opcion

case $opcion in
    1)
        echo ""
        echo "=== AGREGAR NUEVO USUARIO ==="
        read -p "Nombre de usuario (cn): " cn
        read -p "Nombre: " nombre
        read -p "Apellido: " apellido
        
        while true; do
            read -p "Email: " email
            if validar_email "$email"; then
                break
            else
                echo "❌ Email no válido. Intente de nuevo."
            fi
        done
        
        read -p "Teléfono: " telefono
        read -p "Título/Cargo: " titulo
        echo "Departamentos disponibles: IT, HR, Sales"
        read -p "Departamento: " departamento
        read -p "Número de empleado: " empleado_num
        read -s -p "Contraseña: " password
        echo ""
        
        agregar_usuario "$cn" "$nombre" "$apellido" "$email" "$telefono" "$titulo" "$departamento" "$empleado_num" "$password"
        ;;
        
    2)
        echo ""
        echo "=== CREAR NUEVO GRUPO ==="
        read -p "Nombre del grupo: " nombre_grupo
        read -p "Descripción: " descripcion
        crear_grupo "$nombre_grupo" "$descripcion"
        ;;
        
    3)
        echo ""
        listar_grupos_disponibles
        ;;
        
    *)
        echo "Opción no válida"
        exit 1
        ;;
esac

echo ""
echo "✅ Operación completada"