#!/bin/bash

# Script para administrar LDAP - Operaciones comunes
# Uso: ./admin_ldap.sh

# Configuración del servidor LDAP
LDAP_HOST="localhost"
LDAP_PORT="389"
BASE_DN="dc=ejemplo,dc=com"
ADMIN_DN="cn=admin,dc=ejemplo,dc=com"
ADMIN_PASSWORD="admin123"

echo "=== ADMINISTRACIÓN LDAP ==="
echo ""

# Función para mostrar estadísticas del directorio
mostrar_estadisticas() {
    echo "📊 ESTADÍSTICAS DEL DIRECTORIO LDAP"
    echo "================================="
    
    # Contar usuarios
    local usuarios=$(ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "ou=people,${BASE_DN}" \
        "(objectClass=inetOrgPerson)" dn | grep -c "^dn:")
    
    # Contar grupos
    local grupos=$(ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "ou=groups,${BASE_DN}" \
        "(objectClass=groupOfNames)" dn | grep -c "^dn:")
    
    # Contar departamentos
    local departamentos=$(ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "ou=departments,${BASE_DN}" \
        "(objectClass=organizationalUnit)" dn | grep -c "^dn:")
    
    echo "👥 Usuarios: $usuarios"
    echo "🏢 Grupos: $grupos"
    echo "🏗️  Departamentos: $departamentos"
    echo ""
}

# Función para hacer backup del directorio
hacer_backup() {
    local fecha=$(date +"%Y%m%d_%H%M%S")
    local backup_file="backup_ldap_${fecha}.ldif"
    
    echo "💾 Creando backup del directorio LDAP..."
    echo "Archivo: $backup_file"
    
    if ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "$BASE_DN" \
        "(objectClass=*)" > "$backup_file"; then
        
        echo "✅ Backup creado exitosamente: $backup_file"
        local tamaño=$(du -h "$backup_file" | cut -f1)
        echo "📁 Tamaño del archivo: $tamaño"
    else
        echo "❌ Error al crear backup"
    fi
}

# Función para eliminar usuario
eliminar_usuario() {
    local usuario=$1
    local user_dn="cn=${usuario},ou=people,${BASE_DN}"
    
    echo "🗑️  Eliminando usuario: $usuario"
    echo "⚠️  ADVERTENCIA: Esta operación no se puede deshacer"
    
    # Verificar que el usuario existe
    if ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "$user_dn" "(objectClass=*)" > /dev/null 2>&1; then
        
        read -p "¿Está seguro de eliminar el usuario $usuario? (escriba 'ELIMINAR' para confirmar): " confirmacion
        
        if [ "$confirmacion" = "ELIMINAR" ]; then
            # Primero eliminar al usuario de todos los grupos
            eliminar_usuario_de_grupos "$usuario"
            
            # Luego eliminar la entrada del usuario
            if ldapdelete -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
                -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
                "$user_dn"; then
                echo "✅ Usuario $usuario eliminado exitosamente"
            else
                echo "❌ Error al eliminar usuario $usuario"
            fi
        else
            echo "❌ Operación cancelada"
        fi
    else
        echo "❌ El usuario $usuario no existe"
    fi
}

# Función para eliminar usuario de todos los grupos
eliminar_usuario_de_grupos() {
    local usuario=$1
    local user_dn="cn=${usuario},ou=people,${BASE_DN}"
    
    echo "👥 Eliminando usuario de todos los grupos..."
    
    # Buscar grupos que contengan al usuario
    local grupos=$(ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "ou=groups,${BASE_DN}" \
        "(member=${user_dn})" cn | grep "^cn:" | sed 's/cn: //')
    
    for grupo in $grupos; do
        echo "  Eliminando de grupo: $grupo"
        local group_dn="cn=${grupo},ou=groups,${BASE_DN}"
        
        local temp_file=$(mktemp)
        cat > "$temp_file" << EOF
dn: $group_dn
changetype: modify
delete: member
member: $user_dn
EOF
        
        ldapmodify -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
            -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
            -f "$temp_file" > /dev/null 2>&1
            
        rm -f "$temp_file"
    done
}

# Función para modificar usuario
modificar_usuario() {
    local usuario=$1
    local user_dn="cn=${usuario},ou=people,${BASE_DN}"
    
    echo "✏️  Modificando usuario: $usuario"
    
    # Verificar que el usuario existe
    if ! ldapsearch -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -b "$user_dn" "(objectClass=*)" > /dev/null 2>&1; then
        echo "❌ El usuario $usuario no existe"
        return 1
    fi
    
    echo ""
    echo "Seleccione qué modificar:"
    echo "1) Email"
    echo "2) Teléfono"
    echo "3) Título/Cargo"
    echo "4) Departamento"
    echo ""
    read -p "Opción: " opcion_mod
    
    case $opcion_mod in
        1)
            read -p "Nuevo email: " nuevo_email
            modificar_atributo "$user_dn" "mail" "$nuevo_email"
            ;;
        2)
            read -p "Nuevo teléfono: " nuevo_telefono
            modificar_atributo "$user_dn" "telephoneNumber" "$nuevo_telefono"
            ;;
        3)
            read -p "Nuevo título/cargo: " nuevo_titulo
            modificar_atributo "$user_dn" "title" "$nuevo_titulo"
            ;;
        4)
            echo "Departamentos disponibles: IT, HR, Sales"
            read -p "Nuevo departamento: " nuevo_departamento
            modificar_atributo "$user_dn" "departmentNumber" "$nuevo_departamento"
            ;;
        *)
            echo "Opción no válida"
            return 1
            ;;
    esac
}

# Función auxiliar para modificar atributos
modificar_atributo() {
    local dn=$1
    local atributo=$2
    local valor=$3
    
    local temp_file=$(mktemp)
    cat > "$temp_file" << EOF
dn: $dn
changetype: modify
replace: $atributo
$atributo: $valor
EOF
    
    if ldapmodify -x -H "ldap://${LDAP_HOST}:${LDAP_PORT}" \
        -D "$ADMIN_DN" -w "$ADMIN_PASSWORD" \
        -f "$temp_file"; then
        echo "✅ Atributo $atributo modificado exitosamente"
    else
        echo "❌ Error al modificar atributo $atributo"
    fi
    
    rm -f "$temp_file"
}

# Función para mostrar logs (simulada)
mostrar_logs() {
    echo "📋 LOGS DEL SERVIDOR LDAP"
    echo "========================"
    echo "Esta funcionalidad requiere acceso a los logs del contenedor Docker"
    echo ""
    echo "Para ver logs en tiempo real, ejecute:"
    echo "docker logs -f ldap-server"
    echo ""
    echo "Para ver logs de phpLDAPadmin:"
    echo "docker logs -f ldap-admin"
}

# Menú principal
mostrar_estadisticas

echo "Seleccione una operación:"
echo "1) Hacer backup del directorio"
echo "2) Eliminar usuario"
echo "3) Modificar usuario"
echo "4) Ver logs del servidor"
echo "5) Mostrar estadísticas actualizadas"
echo ""
read -p "Opción: " opcion

case $opcion in
    1)
        hacer_backup
        ;;
    2)
        read -p "Usuario a eliminar: " usuario
        eliminar_usuario "$usuario"
        ;;
    3)
        read -p "Usuario a modificar: " usuario
        modificar_usuario "$usuario"
        ;;
    4)
        mostrar_logs
        ;;
    5)
        mostrar_estadisticas
        ;;
    *)
        echo "Opción no válida"
        exit 1
        ;;
esac

echo ""
echo "✅ Operación completada"