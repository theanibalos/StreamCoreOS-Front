# ══════════════════════════════════════════════════════════════════
# StreamCoreOS Frontend — Production Dockerfile
# ══════════════════════════════════════════════════════════════════

FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# adapter-node is required for Node.js / Docker deployments
RUN pnpm add -D @sveltejs/adapter-node

COPY . .
RUN pnpm build

# ── Runtime ────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "build"]
