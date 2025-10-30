# Guía de Contribución a LdapNexus

¡Gracias por tu interés en contribuir a LdapNexus! Este documento proporciona pautas para contribuir al proyecto.

## 🤝 Cómo Contribuir

### Reportar Bugs

Si encuentras un bug, por favor crea un issue con:

1. **Título descriptivo** del problema
2. **Pasos para reproducir** el error
3. **Comportamiento esperado** vs comportamiento actual
4. **Capturas de pantalla** si aplica
5. **Información del entorno**:
   - Versión de Docker
   - Sistema operativo
   - Navegador (si es un problema de UI)

### Sugerir Features

Para sugerir nuevas características:

1. Verifica que no exista ya un issue similar
2. Crea un nuevo issue con el tag `enhancement`
3. Describe claramente:
   - El problema que resuelve
   - El comportamiento deseado
   - Posibles alternativas consideradas

### Pull Requests

1. **Fork** el repositorio
2. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feature/mi-nueva-caracteristica
   ```
3. **Realiza tus cambios** siguiendo las convenciones del proyecto
4. **Prueba** tus cambios localmente
5. **Commit** con mensajes descriptivos:
   ```bash
   git commit -m "feat: agregar validación de email en formulario"
   ```
6. **Push** a tu fork:
   ```bash
   git push origin feature/mi-nueva-caracteristica
   ```
7. **Abre un Pull Request** hacia `main`

## 📝 Convenciones de Código

### JavaScript

- Usar **ES6+** features
- **Indentación**: 2 espacios
- **Punto y coma**: obligatorio
- **Comillas**: simples para strings
- **Nombres**: camelCase para variables, PascalCase para clases

```javascript
// ✅ Correcto
const userName = 'Juan';
class UserService {
  getUserById(id) {
    return this.users.find(user => user.id === id);
  }
}

// ❌ Incorrecto
const user_name = "Juan"
class userService {
  getuserbyid(id) {
    return this.users.find(user => user.id === id)
  }
}
```

### CSS

- Usar **variables CSS** para colores y valores reutilizables
- **BEM naming** para clases cuando sea apropiado
- **Mobile-first** approach

### EJS Templates

- **Indentación consistente** (2 espacios)
- **Comentarios** para secciones complejas
- Usar **partials** para componentes reutilizables

## 🧪 Testing

Antes de enviar tu PR, asegúrate de:

1. **Probar localmente** con Docker:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

2. **Verificar la funcionalidad** afectada
3. **Probar en diferentes navegadores** (Chrome, Firefox, Safari)
4. **Verificar responsive design** (móvil, tablet, desktop)

## 📋 Checklist para Pull Requests

- [ ] El código sigue las convenciones del proyecto
- [ ] Los commits tienen mensajes descriptivos
- [ ] La funcionalidad fue probada localmente
- [ ] Se actualizó la documentación si es necesario
- [ ] No hay conflictos con la rama `main`
- [ ] El PR tiene una descripción clara del cambio

## 🎯 Áreas de Contribución

### Backend
- Mejoras en servicios LDAP
- Optimización de queries
- Nuevos endpoints API
- Mejoras de seguridad

### Frontend
- Mejoras de UI/UX
- Nuevos componentes
- Optimización de rendimiento
- Accesibilidad

### DevOps
- Optimización de Docker
- Scripts de automatización
- Mejoras de logging
- Monitoreo

### Documentación
- Tutoriales
- Guías de uso
- Traducciones
- Ejemplos de código

## 🔒 Seguridad

Si encuentras una vulnerabilidad de seguridad, **NO** abras un issue público. En su lugar, envía un email a [tu-email] con:

- Descripción de la vulnerabilidad
- Pasos para reproducirla
- Impacto potencial
- Posible solución (si la tienes)

## 📜 Licencia

Al contribuir a LdapNexus, aceptas que tus contribuciones se licencien bajo la licencia MIT del proyecto.

## ❓ Preguntas

Si tienes preguntas sobre cómo contribuir, puedes:

- Abrir un issue con la etiqueta `question`
- Iniciar una discusión en GitHub Discussions
- Contactar a los maintainers

¡Gracias por hacer de LdapNexus un mejor proyecto! 🎉
