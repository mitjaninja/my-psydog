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

## Деплой

Один VPS в РФ с Docker. Сервисы в `docker-compose.yml`: `postgres` (данные в volume `pgdata`), `api` (API + бот + крон напоминаний; при старте `prisma migrate deploy`), `caddy` (статика Mini App, `/api/*` → api:3000, авто-HTTPS), `backup` (ежедневный `pg_dump`).

1. Направь A-запись домена на VPS, открой порты 80 и 443.
2. На сервере: `git clone`, затем `cp .env.example .env` и заполни:
   - `BOT_TOKEN`, `BOT_USERNAME` — от @BotFather;
   - `DOMAIN` — домен, `WEBAPP_URL=https://<DOMAIN>`;
   - `POSTGRES_PASSWORD` — любой длинный пароль (`DATABASE_URL` compose соберёт сам);
   - `NOTES_ENCRYPTION_KEY` — `openssl rand -base64 32`. **Не теряй и не меняй**: без него старые заметки не расшифровать;
   - `NODE_ENV=production`.
3. `docker compose up -d --build`, проверка: `curl https://<DOMAIN>/api/health`.
4. В @BotFather: `/myapps` → бот → Edit Web App URL → `https://<DOMAIN>`. Кнопку меню бота api ставит сам при старте.

Обновление: `git pull && docker compose up -d --build`. Логи: `docker compose logs -f api`.

**Важно про уведомления психологу:** Telegram не даёт боту писать первым. Психолог должен один раз открыть чат с ботом и нажать «Старт», иначе кризисное уведомление не дойдёт (событие всё равно записывается).

### Бэкап

Сервис `backup` раз в сутки кладёт `app-YYYY-MM-DD.dump` в volume `backups` и удаляет файлы старше 14 дней. Забрать копию на свою машину:

```bash
docker compose cp backup:/backups ./backups
```

Восстановление в пустую базу:

```bash
docker compose cp ./backups/app-2026-01-01.dump postgres:/tmp/restore.dump
docker compose exec postgres pg_restore -U app -d app --clean --if-exists /tmp/restore.dump
```

Volume с бэкапами живёт на том же сервере — периодически копируй дампы во внешнее хранилище.

## Структура

```
apps/web         Mini App (React 18 + Vite + Tailwind)
apps/api         Fastify + Prisma (grammY — с шага 10)
packages/shared  общие типы и схемы
```

## Скрипты

`pnpm dev` · `pnpm test` · `pnpm typecheck` · `pnpm lint` · `pnpm format`
