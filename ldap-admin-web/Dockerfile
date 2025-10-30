# Dockerfile para LDAP Admin Web
FROM node:18-alpine

# Información del mantenedor
LABEL maintainer="LDAP Admin Team"
LABEL description="Interfaz web segura para administración y aprendizaje de LDAP"

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ldapadmin -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    curl \
    tini \
    && rm -rf /var/cache/apk/*

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fuente
COPY --chown=ldapadmin:nodejs . .

# Cambiar al usuario no-root
USER ldapadmin

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Usar tini como init system para manejar señales correctamente
ENTRYPOINT ["/sbin/tini", "--"]

# Comando por defecto
CMD ["node", "src/app.js"]