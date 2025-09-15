# ----- Etapa 1: Build -----
# Usamos una imagen de Node.js para construir la aplicación React
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json para instalar dependencias
# Esto aprovecha el caché de Docker si no han cambiado
COPY package.json package-lock.json ./
RUN npm ci

# Copiamos el resto del código fuente de la aplicación
COPY . .

# Construimos la aplicación para producción
RUN npm run build

# ----- Etapa 2: Production -----
# Usamos una imagen ligera de Nginx para servir los archivos estáticos
FROM node:18-alpine AS runtime

WORKDIR /app

# Instalar Supervisor
RUN apk add --no-cache supervisor

# Crear usuario no-root
RUN addgroup appuser && adduser -D -G appuser appuser

# Crear carpetas para logs de Supervisor y la build
RUN mkdir -p /app/supervisor /app/dist && chown -R appuser:appuser /app/supervisor /app/dist /app

# Instalar PM2 globalmente
RUN npm install -g pm2

# Copiar build de frontend
COPY --from=builder /app/build /app/build

# Copiar configuración de Supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Cambiar a usuario no-root
USER appuser

# Exponer puerto de la SPA
EXPOSE 80

# Comando para iniciar Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
