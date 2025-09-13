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
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
