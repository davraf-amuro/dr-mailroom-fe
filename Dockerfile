# dr-mailroom-fe — immagine multi-stage: build Vite con Node, file statici serviti da nginx.
# public/config.json non entra nell'immagine (.dockerignore): si monta a runtime (docker-compose.yml).

FROM node:24-alpine AS build
WORKDIR /app

# Prima i soli manifest: l'installazione resta in cache finché le dipendenze non cambiano
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS final

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
