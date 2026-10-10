# my-psydog

Telegram Mini App: клиент психолога выполняет короткие практики между сессиями, заботясь о персонаже «Малыш» (метафора внутреннего ребёнка из схема-терапии). Психолог назначает практики и видит сводку перед сессией.

- Технический спек (порядок сборки по шагам): [SPEC.md](SPEC.md)
- PRD: https://claude.ai/artifact/DUSmK8seJ3ZQ8Z49fpvw9f

## Локальный запуск

Нужны Node 20+, pnpm 10, Docker.

```bash
cp .env.example .env
pnpm install
pnpm db:up        # Postgres 16 из docker-compose.dev.yml
pnpm dev          # web — http://localhost:5173, api — http://localhost:3000
```

Vite проксирует `/api` на api, проверка: `curl http://localhost:5173/api/health` → `{"ok":true}`.

## Структура

```
apps/web         Mini App (React 18 + Vite + Tailwind)
apps/api         Fastify (+ Prisma и grammY с шага 2)
packages/shared  общие типы и схемы
```

## Скрипты

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm format`
