FROM node:22-alpine AS builder

RUN npm install -g pnpm

ENV CI=true

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN node_modules/.bin/vite build

# ── Runtime — nginx sirve los archivos estáticos ───────────────────
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
