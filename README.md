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

## Авторизация

Каждый запрос web → api несёт `Authorization: tma <initDataRaw>`; api проверяет подпись по `BOT_TOKEN` и срок (24 ч), затем создаёт или находит пользователя по Telegram ID.

Для разработки в обычном браузере (только `NODE_ENV=development`): открой `http://localhost:5173/?devTgId=42` — web пошлёт `X-Dev-Tg-Id: 42` вместо initData. Без `?devTgId` используется последний введённый ID или `1`. В production этот заголовок не принимается, а api без `BOT_TOKEN` не стартует.

## Тесты

`pnpm test` — юнит- и интеграционные тесты api на `node:test`. Интеграционные ходят в отдельную базу `app_test` из `.env.test` (миграции применяются автоматически, таблицы чистятся перед каждым тестом). Пользователю `app` нужно право `CREATEDB`, либо создай базу `app_test` заранее.

## Структура

```
apps/web         Mini App (React 18 + Vite + Tailwind)
apps/api         Fastify + Prisma (grammY — с шага 10)
packages/shared  общие типы и схемы
```

## Скрипты

`pnpm dev` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm format`
