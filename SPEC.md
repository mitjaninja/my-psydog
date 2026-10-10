# SPEC: Тамагочи для домашних заданий между сессиями — Telegram Mini App (MVP)

> Документ для Claude Code. Выполняй шаги строго по порядку. После каждого шага: запусти проверки из блока «Готово, когда», покажи результат и остановись до подтверждения. Не добавляй функций вне скоупа шага.

---

## 0. Контекст продукта (прочитать перед работой)

Клиент психолога выполняет короткие практики между сессиями, «заботясь» о милом персонаже. Персонаж — метафора внутреннего ребёнка из схема-терапии; пользователь — Здоровый Взрослый. У персонажа 5 шкал базовых потребностей. Психолог назначает практики и видит сводку перед сессией.

**Две роли в одном Mini App:** `client` и `psychologist`. Клиенту бесплатно, психолог платит (оплата — не в MVP).

### Жёсткие продуктовые правила (нарушать нельзя)

1. Персонаж **никогда** не умирает, не болеет и не грустит из-за пропусков. После паузы — радуется возвращению.
2. Нет стриков, очков, рейтингов, красных индикаторов «провала». Пропуски у психолога — нейтральный серый.
3. Тексты UI — тёплые, без «ты должен», «не забудь», «ты пропустил». Обращение на «ты».
4. Кнопка «Мне очень плохо» доступна с главного экрана клиента всегда.
5. Не собираем ФИО, телефон, email. Идентификатор — Telegram ID.
6. Заметки клиента видны психологу только если клиент поставил галочку «показать психологу».

---

## 1. Стек и структура

| Слой | Технология |
| --- | --- |
| Монорепо | pnpm workspaces |
| Frontend (Mini App) | React 18 + Vite + TypeScript, `@telegram-apps/sdk-react`, React Router, TanStack Query |
| Стили | CSS-переменные Telegram (`--tg-theme-*`) + Tailwind |
| Персонаж | Inline SVG-компонент с 4 состояниями (заглушка), позже — Lottie |
| Backend | Node.js 20 + Fastify + TypeScript, Zod для валидации |
| ORM / БД | Prisma + PostgreSQL 16 |
| Бот | grammY (в том же backend-процессе) |
| Крон-задачи | `node-cron` внутри backend |
| Деплой | Docker Compose + Caddy (авто-HTTPS) на VPS в РФ |

```
/
├── apps/
│   ├── web/          # Mini App (React)
│   └── api/          # Fastify + Prisma + grammY
├── packages/
│   └── shared/       # общие типы, enum потребностей, zod-схемы
├── docker-compose.yml
├── Caddyfile
├── .env.example
└── SPEC.md
```

---

## Шаг 0. Ручная подготовка (делает человек, не Claude Code)

- [ ] Создать бота в @BotFather → получить `BOT_TOKEN`.
- [ ] В @BotFather: `/newapp` → привязать Mini App к боту, short name `app`. URL пока временный.
- [ ] Для локальной разработки: установить `cloudflared` или `ngrok` (Mini App требует HTTPS).
- [ ] Арендовать VPS в РФ (Timeweb Cloud / Selectel / Yandex Cloud), купить домен, направить A-запись.
- [ ] Узнать свой Telegram ID (например, через @userinfobot) — для `ADMIN_TG_IDS`.

---

## Шаг 1. Скаффолдинг монорепо

**Задача:** создать структуру из раздела 1, настроить TypeScript, ESLint, Prettier, pnpm-скрипты.

- `pnpm dev` поднимает web (порт 5173) и api (порт 3000) параллельно.
- `docker-compose.dev.yml` поднимает только Postgres.
- `.env.example`:
  ```
  BOT_TOKEN=
  WEBAPP_URL=https://<tunnel-or-domain>
  DATABASE_URL=postgresql://app:app@localhost:5432/app
  ADMIN_TG_IDS=123456789
  NOTES_ENCRYPTION_KEY=   # 32 байта base64
  NODE_ENV=development
  ```
- Vite проксирует `/api` → `http://localhost:3000`.

**Готово, когда:** `pnpm install && pnpm dev` запускается без ошибок, `GET /api/health` → `{ ok: true }`, страница web открывается в браузере.

---

## Шаг 2. Схема БД и сиды

**Задача:** описать Prisma-схему, миграцию и сид практик.

```prisma
enum Role { CLIENT PSYCHOLOGIST }
enum Need { SAFETY AUTONOMY EXPRESSION PLAY LIMITS }
enum Mood { CALM JOYFUL HIDING SCARED }   // состояния персонажа
enum InputType { TEXT LIST CHECKLIST TIMER }

model User {
  id          String   @id @default(cuid())
  tgId        BigInt   @unique
  role        Role?
  firstName   String?  // из initData, только для отображения
  createdAt   DateTime @default(now())
  psychologist Psychologist?
  client       Client?
}

model Psychologist {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  displayName String
  clients   Client[]
  invites   Invite[]
  createdAt DateTime @default(now())
}

model Client {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  psychologistId String
  psychologist   Psychologist @relation(fields: [psychologistId], references: [id])
  alias          String   // как психолог подписал клиента, напр. «А., вторник»
  characterName  String   @default("Малыш")
  reminderHour   Int?     // локальный час напоминания, null = выкл
  timezone       String   @default("Europe/Moscow")
  onboardedAt    DateTime?
  createdAt      DateTime @default(now())
  consents       Consent[]
  checkins       Checkin[]
  completions    Completion[]
  assignments    Assignment[]
  crisisEvents   CrisisEvent[]
}

model Invite {
  id             String   @id @default(cuid())
  code           String   @unique   // 10 символов, url-safe
  psychologistId String
  psychologist   Psychologist @relation(fields: [psychologistId], references: [id])
  alias          String
  usedAt         DateTime?
  expiresAt      DateTime
}

model Practice {
  id          String    @id          // slug, напр. "safe-place"
  need        Need
  title       String
  summary     String                 // 1 предложение
  steps       Json                   // string[]
  inputType   InputType
  durationMin Int
  isComforting Boolean  @default(false) // для режима «мне тяжело»
  isActive    Boolean   @default(true)
}

model Assignment {
  id         String   @id @default(cuid())
  clientId   String
  client     Client   @relation(fields: [clientId], references: [id])
  practiceId String
  practice   Practice @relation(fields: [practiceId], references: [id])
  activeFrom DateTime @default(now())
  activeTo   DateTime?
}

model Checkin {
  id        String   @id @default(cuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id])
  date      DateTime @db.Date
  mood      Mood
  lowNeed   Need?
  isHardDay Boolean  @default(false)
  createdAt DateTime @default(now())
  @@unique([clientId, date])
}

model Completion {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  practiceId  String
  practice    Practice @relation(fields: [practiceId], references: [id])
  noteEnc     String?  // зашифрованная заметка (AES-256-GCM)
  shareNote   Boolean  @default(false)
  completedAt DateTime @default(now())
}

model Consent {
  id        String   @id @default(cuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id])
  type      String   // "data_processing" | "share_with_psychologist" | "crisis_notify"
  version   String
  givenAt   DateTime @default(now())
  revokedAt DateTime?
}

model CrisisEvent {
  id        String   @id @default(cuid())
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id])
  source    String   // "button" | "keyword"
  notified  Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

**Шкалы потребностей не храним** — вычисляем: для каждой `Need` значение 0–100 по выполненным практикам за последние 7 дней (каждая практика +25, максимум 100). Пустая шкала — нейтральное «ждёт заботы», не красная.

**Сид практик** (`apps/api/prisma/seed.ts`). Тексты — черновики, пометить в коде `// TODO: проверка схема-терапевтом`.

| id | need | title | inputType | мин | comforting |
| --- | --- | --- | --- | --- | --- |
| safe-place | SAFETY | Безопасное место | TIMER | 5 | да |
| letter-to-little-me | SAFETY | Письмо малышу | TEXT | 10 | да |
| comfort-phrase | SAFETY | Тёплая фраза себе | TEXT | 3 | да |
| small-step | AUTONOMY | Маленький шаг | TEXT | 5 | нет |
| what-worked | AUTONOMY | Что сегодня получилось | LIST | 5 | нет |
| my-choice | AUTONOMY | Мой выбор сегодня | TEXT | 3 | нет |
| emotion-diary | EXPRESSION | Дневник эмоций | TEXT | 7 | нет |
| name-the-need | EXPRESSION | Назвать потребность | TEXT | 5 | нет |
| ask-for-it | EXPRESSION | Попросить о своём | CHECKLIST | 5 | нет |
| ten-min-joy | PLAY | 10 минут радости | TIMER | 10 | да |
| childhood-joy | PLAY | Что радовало в детстве | LIST | 5 | да |
| silly-thing | PLAY | Немного глупостей | CHECKLIST | 5 | нет |
| say-no | LIMITS | Сказать «нет» | TEXT | 5 | нет |
| pause-impulse | LIMITS | Пауза перед импульсом | TIMER | 3 | нет |
| enough-for-today | LIMITS | На сегодня достаточно | CHECKLIST | 3 | да |
| critic-shield | SAFETY | Защитить малыша от критика | TEXT | 7 | да |

Каждой практике — 3–5 шагов в `steps` и `summary` в одно предложение, тон по правилам из раздела 0.

**Готово, когда:** `pnpm prisma migrate dev` и `pnpm db:seed` проходят, в БД 16 практик.

---

## Шаг 3. Авторизация через Telegram initData

**Задача:** каждый запрос web → api несёт заголовок `Authorization: tma <initDataRaw>`.

- Backend middleware валидирует подпись по официальному алгоритму Telegram (HMAC-SHA256, ключ = HMAC("WebAppData", BOT_TOKEN)), проверяет `auth_date` не старше 24 часов.
- Использовать `@telegram-apps/init-data-node` (`validate`, `parse`).
- После валидации: upsert `User` по `tgId`, положить `request.user`.
- В dev-режиме (`NODE_ENV=development`) разрешить заголовок `X-Dev-Tg-Id` для тестов в браузере. В production — запрещено.
- Frontend: инициализировать SDK, вызвать `miniApp.ready()`, `viewport.expand()`, применить тему Telegram.

**Готово, когда:** юнит-тест валидации проходит на корректной и подделанной строке; `GET /api/me` возвращает пользователя и его роль.

---

## Шаг 4. Роли и приглашения

**Логика входа (`/api/me` + роутинг web):**

1. Есть `startapp`-параметр `inv_<code>` и пользователь без роли → экран принятия приглашения → становится `CLIENT`, привязан к психологу.
2. Пользователь без роли и без приглашения → экран «Я психолог» (регистрация, ввести отображаемое имя) или текст «Попросите у своего психолога ссылку».
3. Роль есть → соответствующий интерфейс.

**Ссылка-приглашение:** `https://t.me/<bot_username>/app?startapp=inv_<code>`. Код одноразовый, живёт 14 дней.

**API:**

| Метод | Путь | Роль | Назначение |
| --- | --- | --- | --- |
| GET | /api/me | любая | профиль, роль, данные для роутинга |
| POST | /api/psychologist/register | без роли | стать психологом |
| POST | /api/invites | psychologist | создать приглашение `{ alias }` → `{ link }` |
| POST | /api/invites/:code/accept | без роли | стать клиентом |

**Готово, когда:** два тестовых Telegram-аккаунта: один регистрируется психологом и создаёт ссылку, второй открывает ссылку и становится его клиентом. Повторное использование кода → 409.

---

## Шаг 5. Онбординг и согласия клиента

Экраны (свайп/кнопка «Дальше»):

1. Знакомство: персонаж машет, текст: «Привет. Это твой малыш. Он немного похож на тебя маленького».
2. 5 потребностей — по карточке на каждую, коротко и тепло.
3. Как это работает: раз в день спрашиваем, как малыш, и предлагаем одну небольшую практику. Пропускать можно — малыш всегда рад тебя видеть.
4. **Согласия** (отдельные чекбоксы, первый обязателен):
   - обработка данных о состоянии (обязательно);
   - передача сводки психологу (обязательно для работы с психологом);
   - уведомить психолога, если я нажму «Мне очень плохо» (опционально).
   - Текст: «Это приложение не заменяет терапию и экстренную помощь».
5. Имя для малыша (по умолчанию «Малыш») и время напоминания (или «без напоминаний»).

**Готово, когда:** без обязательных согласий нельзя пройти дальше; согласия пишутся в `Consent` с `version: "1.0"`; `onboardedAt` выставлен.

---

## Шаг 6. Персонаж (компонент)

- `apps/web/src/components/Character.tsx` — inline SVG, пропсы `mood: Mood`, `size`.
- 4 состояния: CALM (лёгкое «дыхание» — scale-анимация), JOYFUL (подпрыгивает), HIDING (прикрыл глаза ладошками), SCARED (сжался, дрожит).
- Существо без пола и возраста: круглое тело, большие глаза, маленькие лапки. Цвет тела берётся из CSS-переменной, чтобы потом легко менять.
- Анимации через CSS, учитывать `prefers-reduced-motion`.

**Готово, когда:** страница `/dev/character` (только в dev) показывает все 4 состояния.

---

## Шаг 7. Ежедневная петля клиента

**Экраны и роуты:**

| Роут | Экран |
| --- | --- |
| /home | Персонаж в текущем состоянии, 5 шкал (мягкие цвета), кнопка «Как малыш сегодня?», ссылка на назначенные практики, кнопка «Мне очень плохо» |
| /checkin | Шаг 1: выбор состояния (4 варианта с иконками персонажа). Шаг 2: «Чего малышу сегодня не хватает?» — 5 потребностей. Отметка «Сегодня тяжело» |
| /practice/:id | Название, summary, шаги, поле ввода по `inputType`, чекбокс «Показать заметку психологу», кнопка «Готово» |
| /done | Персонаж JOYFUL, тёплая фраза из пула (10–15 вариантов), шкала потребности плавно растёт |
| /history | Список выполненных практик по дням, без пустых «дыр» и пометок о пропусках |

**Логика подбора практики после чек-ина:**

1. Если `isHardDay` или mood ∈ {HIDING, SCARED} → случайная практика с `isComforting = true` (для SCARED — приоритет `critic-shield`).
2. Иначе, если есть активное назначение от психолога с той же `lowNeed` → она.
3. Иначе любое активное назначение.
4. Иначе случайная практика с `need = lowNeed`.

Показать одну практику + ссылку «Выбрать другую».

**Состояние персонажа на /home:** mood последнего чек-ина за сегодня; если чек-ина сегодня нет — CALM. Никогда не выводить негативное состояние из-за отсутствия активности.

**API:**

| Метод | Путь | Назначение |
| --- | --- | --- |
| GET | /api/client/home | mood, шкалы, назначения |
| POST | /api/client/checkin | `{ mood, lowNeed?, isHardDay }` → `{ suggestedPractice }` |
| GET | /api/practices/:id | практика |
| POST | /api/client/completions | `{ practiceId, note?, shareNote }` |
| GET | /api/client/history | выполненные практики |
| PATCH | /api/client/settings | имя малыша, напоминание |
| DELETE | /api/client/data | удалить все свои данные |

Заметки шифровать AES-256-GCM ключом `NOTES_ENCRYPTION_KEY` перед записью.

**Готово, когда:** полный цикл чек-ин → практика → завершение работает; шкала растёт; повторный чек-ин в тот же день обновляет запись, а не создаёт новую.

---

## Шаг 8. Кризисный сценарий

- Кнопка «Мне очень плохо» → экран `/crisis`:
  - текст: «Сейчас главное — чтобы рядом был живой человек. Позвони тому, кому доверяешь, или в службу помощи»;
  - список контактов из `apps/web/src/config/crisis.ts` (номер + кнопка `tel:`). **Номера оставить как `TODO: проверить актуальность` — заполняет человек;**
  - экстренный номер 112;
  - кнопка «Вернуться к малышу».
- Создать `CrisisEvent(source: "button")`.
- Если есть согласие `crisis_notify` → бот отправляет психологу: «<alias> отметил(а), что ему(ей) сейчас очень плохо». Без деталей и заметок.
- Ключевые слова в заметках (список в `apps/api/src/crisis/keywords.ts`, нормализация регистра и ё/е): при совпадении после сохранения практики показать экран `/crisis` и создать `CrisisEvent(source: "keyword")`.

**Готово, когда:** нажатие кнопки показывает экран и (при согласии) приходит сообщение психологу; тест на детектор ключевых слов проходит.

---

## Шаг 9. Кабинет психолога

| Роут | Экран |
| --- | --- |
| /p/clients | Список клиентов: alias, дата последней активности (нейтральным текстом), кнопка «Пригласить клиента» |
| /p/invite | Ввод alias → ссылка + кнопка «Поделиться» (`shareURL` из SDK) |
| /p/clients/:id | Сводка за период (по умолчанию 7 дней, переключатель 14/30): шкалы потребностей, число чек-инов, трудные дни, выполненные практики, заметки с `shareNote = true` |
| /p/clients/:id/assign | Выбор практик из библиотеки, сгруппированных по потребностям; снять назначение |

**Правила отображения:** никаких процентов выполнения, красных цветов и слов «пропущено». Трудные дни — нейтральная иконка.

**API:**

| Метод | Путь |
| --- | --- |
| GET | /api/p/clients |
| GET | /api/p/clients/:id/summary?days=7 |
| GET | /api/practices |
| POST | /api/p/clients/:id/assignments `{ practiceIds[] }` |
| DELETE | /api/p/assignments/:id |

Каждый эндпоинт `/api/p/*` проверяет, что клиент принадлежит этому психологу.

**Готово, когда:** психолог видит своих клиентов и только их; назначенная практика появляется у клиента; заметки без `shareNote` не попадают в ответ API (проверить тестом).

---

## Шаг 10. Бот и напоминания

- `/start` → приветствие и кнопка `web_app`, открывающая Mini App. `/start inv_<code>` → та же кнопка с параметром.
- Кнопка меню бота (`setChatMenuButton`) → Mini App.
- Крон раз в час: клиентам с `reminderHour`, совпадающим с текущим локальным часом, и без чек-ина сегодня — одно сообщение из пула мягких фраз («Малыш тебя ждёт, когда будет минутка»). Не больше одного в день. Никаких напоминаний после 3 дней без активности подряд — только одно «Мы тут, когда захочешь вернуться» и пауза.
- Психологу — уведомления только о кризисных событиях (шаг 8).

**Готово, когда:** напоминание приходит в выставленный час на тестовом аккаунте; повторно в тот же день не приходит.

---

## Шаг 11. Деплой

- `Dockerfile` для api (multi-stage), web собирается в статику и раздаётся Caddy.
- `docker-compose.yml`: `postgres` (volume), `api`, `caddy`.
- `Caddyfile`: домен → статика web, `/api/*` → api:3000, авто-HTTPS.
- Миграции при старте api: `prisma migrate deploy`.
- Бэкап БД: ежедневный `pg_dump` в volume + инструкция в README.
- Обновить URL Mini App в @BotFather на боевой домен.

**Готово, когда:** Mini App открывается из бота на телефоне по боевому домену, полный сценарий шагов 4–10 проходит.

---

## Шаг 12. Финальная проверка перед пилотом

- [ ] Весь UI-текст прогнан по правилам раздела 0: нет «должен», «пропустил», «не забудь».
- [ ] Светлая и тёмная тема Telegram выглядят корректно.
- [ ] Экран 360 px — без горизонтального скролла.
- [ ] Психолог A не видит клиентов психолога B (тест).
- [ ] Заметки в БД зашифрованы.
- [ ] Удаление данных клиентом удаляет чек-ины, практики, заметки, согласия.
- [ ] Кризисный экран открывается в 1 нажатие с главного экрана.
- [ ] Номера на кризисном экране проверены человеком.
- [ ] README: запуск локально, деплой, переменные окружения, бэкап.

---

## Вне скоупа MVP (не делать)

Оплата, свои практики психолога, домик с предметами, Lottie-анимации, аудио, кабинет школы, AI-функции, аналитика, админка (практики правятся через сид).
