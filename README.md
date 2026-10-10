# my-psydog

Telegram Mini App: клиент психолога выполняет короткие практики между сессиями, заботясь о персонаже «Малыш» (метафора внутреннего ребёнка из схема-терапии). Психолог назначает практики и видит сводку перед сессией.

- Технический спек (порядок сборки по шагам): [SPEC.md](SPEC.md)
- PRD: https://claude.ai/artifact/DUSmK8seJ3ZQ8Z49fpvw9f

## Локальный запуск

Нужны Node 20+, pnpm 10, Docker.

```bash
cp .env.example .env
pnpm install
pnpm db:up                  # Postgres 16 из docker-compose.dev.yml
pnpm prisma migrate dev     # применить миграции
pnpm db:seed                # 16 практик (повторный запуск безопасен — upsert)
pnpm dev                    # web — http://localhost:5173, api — http://localhost:3000
```

Без Docker подойдёт любой локальный Postgres 16 с пользователем и базой `app`/`app`, как в `DATABASE_URL`.

Prisma-команды запускаются из корня через `pnpm prisma <команда>` и читают корневой `.env`. Тексты практик — в `apps/api/prisma/seed.ts`, черновые, ждут проверки схема-терапевтом.

Vite проксирует `/api` на api, проверка: `curl http://localhost:5173/api/health` → `{"ok":true}`.

## Структура

```
apps/web         Mini App (React 18 + Vite + Tailwind)
apps/api         Fastify + Prisma (grammY — с шага 10)
packages/shared  общие типы и схемы
```

## Скрипты

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm format`
