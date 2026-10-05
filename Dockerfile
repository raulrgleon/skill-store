FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Servidor propio (sin dependencias): sirve la web y el panel /admin con login.
FROM node:22-alpine
RUN apk add --no-cache git openssh-client
WORKDIR /app
ENV NODE_ENV=production PORT=80 SKILLSTORE_ROOT=/data/repo
COPY package.json ./
COPY server ./server
COPY --from=build /app/dist ./dist
COPY deploy/known_hosts /etc/ssh/ssh_known_hosts
COPY deploy/entrypoint.sh /entrypoint.sh
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:80/healthz || exit 1
ENTRYPOINT ["/entrypoint.sh"]
