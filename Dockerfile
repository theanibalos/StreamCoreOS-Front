FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN node_modules/.bin/vite build

# ── Runtime — nginx sirve los archivos estáticos ───────────────────
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
