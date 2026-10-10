# syntax=docker/dockerfile:1
# Один Dockerfile на монорепо: target "api" — Node-процесс (API + бот + крон),
# target "caddy" — статика Mini App и реверс-прокси с авто-HTTPS.

FROM node:20-bookworm-slim AS base
RUN corepack enable && apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# --- Сборка web в статику ---
FROM base AS web-build
RUN pnpm install --frozen-lockfile --filter @psydog/web...
COPY packages/shared packages/shared
COPY apps/web apps/web
COPY tsconfig.base.json ./
RUN pnpm --filter @psydog/web build

# --- API: только prod-зависимости ---
FROM base AS api
RUN pnpm install --prod --frozen-lockfile --filter @psydog/api...
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @psydog/api exec prisma generate
ENV NODE_ENV=production PORT=3000
WORKDIR /app/apps/api
EXPOSE 3000
# Миграции при старте, затем API (TS исполняется через tsx — общий пакет shared без сборки)
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && exec pnpm exec tsx src/index.ts"]

# --- Caddy со статикой web ---
FROM caddy:2-alpine AS caddy
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=web-build /app/apps/web/dist /srv
