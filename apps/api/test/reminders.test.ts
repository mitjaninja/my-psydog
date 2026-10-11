import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { decideReminder, pausePhrase, runReminders, type ReminderState } from '../src/reminders.js';
import { BOT_PROFILE, startReply } from '../src/bot/bot.js';
import { DAY_MS } from '../src/lib/dates.js';
import { as, fakeNotifier, makeApp, prisma, psychologistAndClient, resetDb } from './helpers.js';

// 20:00 по Москве = 17:00 UTC
const at = (iso: string) => new Date(iso);
const NOW = at('2026-10-12T17:05:00Z');
const base: ReminderState = {
  timezone: 'Europe/Moscow',
  reminderHour: 20,
  checkedInToday: false,
  lastActivityAt: new Date(NOW.getTime() - DAY_MS),
  lastReminderAt: null,
  remindersPausedAt: null,
};

test('напоминание только в выбранный локальный час и без чек-ина сегодня', () => {
  assert.equal(decideReminder(base, NOW), 'gentle');
  assert.equal(decideReminder({ ...base, reminderHour: 19 }, NOW), 'none');
  assert.equal(decideReminder({ ...base, reminderHour: null }, NOW), 'none');
  assert.equal(decideReminder({ ...base, checkedInToday: true }, NOW), 'none');
  assert.equal(decideReminder({ ...base, timezone: 'Asia/Yekaterinburg' }, NOW), 'none');
});

test('не больше одного напоминания в день', () => {
  assert.equal(
    decideReminder({ ...base, lastReminderAt: at('2026-10-12T05:00:00Z') }, NOW),
    'none',
  );
  assert.equal(
    decideReminder({ ...base, lastReminderAt: at('2026-10-11T17:00:00Z') }, NOW),
    'gentle',
  );
});

test('после 3 дней без активности — одно «мы тут» и пауза до возвращения', () => {
  const quiet = { ...base, lastActivityAt: new Date(NOW.getTime() - 3 * DAY_MS) };
  assert.equal(decideReminder(quiet, NOW), 'pause');
  const paused = { ...quiet, remindersPausedAt: at('2026-10-11T17:00:00Z') };
  assert.equal(decideReminder(paused, NOW), 'none');
  // Человек вернулся после паузы — напоминания снова идут
  assert.equal(
    decideReminder({ ...paused, lastActivityAt: at('2026-10-12T08:00:00Z') }, NOW),
    'gentle',
  );
});

test('/start: кнопка web_app, с приглашением — с параметром', () => {
  const plain = startReply('', 'https://app.example');
  assert.equal(plain.keyboard.inline_keyboard[0]![0]!.text, 'К Пушку');
  assert.deepEqual(
    (plain.keyboard.inline_keyboard[0]![0]! as { web_app: { url: string } }).web_app,
    { url: 'https://app.example' },
  );
  const inv = startReply('inv_AbCdEf_123', 'https://app.example');
  assert.deepEqual((inv.keyboard.inline_keyboard[0]![0]! as { web_app: { url: string } }).web_app, {
    url: 'https://app.example?startapp=inv_AbCdEf_123',
  });
  const junk = startReply('inv_<script>', 'https://app.example');
  assert.deepEqual(
    (junk.keyboard.inline_keyboard[0]![0]! as { web_app: { url: string } }).web_app,
    { url: 'https://app.example' },
  );
});

test('профиль бота укладывается в лимиты Telegram и без запретных слов', () => {
  assert.ok(BOT_PROFILE.name.length <= 64);
  assert.ok(BOT_PROFILE.description.length <= 512);
  assert.ok(BOT_PROFILE.shortDescription.length <= 120);
  for (const text of Object.values(BOT_PROFILE)) {
    assert.doesNotMatch(text, /не забудь|пропустил|должен/i);
  }
});

// --- Интеграция с БД ---

const notifier = fakeNotifier();
const app = makeApp(notifier);
const deps = { prisma, notifier, webAppUrl: 'https://app.example' };

beforeEach(async () => {
  notifier.sent.length = 0;
  await resetDb();
  const { client } = await psychologistAndClient(app, 100, 200);
  await prisma.client.update({
    where: { id: client.id },
    data: { reminderHour: 20, onboardedAt: new Date(NOW.getTime() - DAY_MS) },
  });
});
after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test('напоминание приходит в выставленный час и не повторяется в тот же день', async () => {
  assert.equal((await runReminders(deps, at('2026-10-12T16:05:00Z'))).length, 0); // 19:05 МСК
  const first = await runReminders(deps, NOW);
  assert.equal(first.length, 1);
  assert.equal(notifier.sent[0]!.tgId, 200n);
  assert.equal(notifier.sent[0]!.webAppUrl, 'https://app.example');
  assert.doesNotMatch(notifier.sent[0]!.text, /не забудь|пропустил|должен/i);
  assert.match(notifier.sent[0]!.text, /Пушок/);
  assert.equal((await runReminders(deps, at('2026-10-12T17:45:00Z'))).length, 0);
  assert.equal(notifier.sent.length, 1);
});

test('после чек-ина сегодня напоминания нет', async () => {
  // Чек-ин на локальную дату NOW (Москва)
  const client = await prisma.client.findFirstOrThrow();
  await prisma.checkin.create({
    data: { clientId: client.id, date: new Date('2026-10-12T00:00:00Z'), mood: 'CALM' },
  });
  assert.equal((await runReminders(deps, NOW)).length, 0);
});

test('3 дня тишины: одно «мы тут», дальше пауза', async () => {
  const client = await prisma.client.findFirstOrThrow();
  await prisma.client.update({
    where: { id: client.id },
    data: { onboardedAt: new Date(NOW.getTime() - 4 * DAY_MS) },
  });
  const r = await runReminders(deps, NOW);
  assert.deepEqual(
    r.map((x) => x.decision),
    ['pause'],
  );
  assert.equal(notifier.sent[0]!.text, pausePhrase('Пушок'));
  assert.equal((await runReminders(deps, new Date(NOW.getTime() + DAY_MS))).length, 0);
  assert.equal((await runReminders(deps, new Date(NOW.getTime() + 2 * DAY_MS))).length, 0);

  // Вернулся — снова мягкие напоминания
  await app.inject({
    method: 'POST',
    url: '/api/client/completions',
    headers: as(200),
    payload: { practiceId: 'say-no', shareNote: false },
  });
  await prisma.completion.updateMany({
    data: { completedAt: new Date(NOW.getTime() + 2 * DAY_MS + 60_000) },
  });
  const back = await runReminders(deps, new Date(NOW.getTime() + 3 * DAY_MS));
  assert.deepEqual(
    back.map((x) => x.decision),
    ['gentle'],
  );
});
