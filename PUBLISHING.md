# 📦 Cómo Publicar LdapNexus en GitHub

Esta guía te ayudará a subir el proyecto LdapNexus a GitHub.

## 🚀 Pasos para Publicar

### 1. Preparar el Repositorio Local

```bash
# Navegar al directorio del proyecto
cd /home/t4ifi/Andres/LDAP/docker-ldap

# Inicializar repositorio Git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Crear el commit inicial
git commit -m "feat: initial commit - LdapNexus v1.0.0

- Interfaz web completa para administración LDAP
- Sistema de autenticación segura
- CRUD de usuarios con validaciones
- Dashboard con estadísticas
- Docker Compose para despliegue fácil
- Documentación completa"
```

### 2. Configurar el Repositorio Remoto

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/t4ifi/LdapNexus.git

# Verificar que se agregó correctamente
git remote -v
```

### 3. Crear la Rama Principal

```bash
# Renombrar la rama a main (si es necesario)
git branch -M main
```

### 4. Subir el Código

```bash
# Push inicial (puede requerir autenticación)
git push -u origin main
```

### 5. Configurar GitHub (Opcional pero Recomendado)

Después de subir el código, en la página de GitHub:

#### a) Configurar el Repositorio
1. Ve a `Settings` en tu repositorio
2. En `General`:
   - Marca "Issues" si quieres habilitar bug tracking
   - Marca "Projects" si planeas usar proyectos
   - Marca "Discussions" para habilitar foros

#### b) Agregar Topics
En la página principal del repo, click en el ícono de engranaje junto a "About":
- `ldap`
- `openldap`
- `nodejs`
- `docker`
- `admin-panel`
- `directory-services`
- `authentication`

#### c) Crear el Primer Release
1. Ve a `Releases` → `Create a new release`
2. Tag: `v1.0.0`
3. Release title: `LdapNexus v1.0.0 - Initial Release`
4. Descripción: Copia el contenido de `CHANGELOG.md`
5. Click en `Publish release`

## 🔐 Configurar Token de Acceso Personal

Si GitHub solicita autenticación:

1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Selecciona los scopes:
   - `repo` (acceso completo al repositorio)
   - `workflow` (si usarás GitHub Actions)
4. Copia el token
5. Úsalo como contraseña cuando hagas push

## 📝 Comandos Git Útiles para el Futuro

```bash
# Ver estado
git status

# Agregar archivos modificados
git add .

# Commit con mensaje
git commit -m "feat: agregar nueva funcionalidad"

# Push
git push

# Ver historial
git log --oneline

# Crear nueva rama
git checkout -b feature/nueva-funcionalidad

# Cambiar de rama
git checkout main

# Merge de rama
git merge feature/nueva-funcionalidad

# Pull cambios remotos
git pull origin main
```

## 🏷️ Convenciones de Commits

Usa estos prefijos para tus commits:

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato (no afectan el código)
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

Ejemplos:
```bash
git commit -m "feat: agregar importación de usuarios CSV"
git commit -m "fix: corregir validación de email en formulario"
git commit -m "docs: actualizar README con nuevas instrucciones"
```

## 📊 GitHub Actions (Opcional)

Para configurar CI/CD, crea `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: docker-compose build
      - name: Run tests
        run: docker-compose up -d && sleep 10 && curl -f http://localhost:3000/health
```

## 🎯 Checklist Pre-Publicación

- [ ] README.md completo y actualizado
- [ ] LICENSE incluido
- [ ] .gitignore configurado
- [ ] Contraseñas sensibles removidas
- [ ] Documentación de API/uso
- [ ] CONTRIBUTING.md incluido
- [ ] Issues templates configurados
- [ ] Proyecto probado localmente

## ✅ Verificación Post-Publicación

Después de publicar, verifica:

1. ✅ El README se muestra correctamente
2. ✅ Los badges funcionan
3. ✅ Los links están correctos
4. ✅ Las imágenes cargan (si las hay)
5. ✅ Los issues templates aparecen
6. ✅ La licencia es visible

## 🌟 Promoción

Una vez publicado, considera:

1. Compartir en redes sociales
2. Publicar en Reddit (r/selfhosted, r/docker)
3. Agregar a listas de awesome-lists relacionadas
4. Escribir un post en Dev.to o Medium
5. Enviar a newsletters de desarrollo

---

¡Éxito con tu publicación! 🎉
