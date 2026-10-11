import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { as, makeApp, prisma, psychologistAndClient, resetDb } from './helpers.js';

const app = makeApp();
beforeEach(async () => {
  await resetDb();
  await psychologistAndClient(app, 100, 200);
});
after(async () => {
  await app.close();
  await prisma.$disconnect();
});

const C = as(200);
const post = (url: string, payload: object, headers = C) =>
  app.inject({ method: 'POST', url, headers, payload });

test('главный экран без чек-ина: CALM, шкалы по нулям', async () => {
  const home = (await app.inject({ url: '/api/client/home', headers: C })).json();
  assert.equal(home.mood, 'CALM');
  assert.equal(home.checkedInToday, false);
  assert.deepEqual(Object.values(home.scales), [0, 0, 0, 0, 0]);
});

test('полный цикл: чек-ин → практика → завершение, шкала растёт', async () => {
  const checkin = await post('/api/client/checkin', {
    mood: 'JOYFUL',
    lowNeed: 'PLAY',
    isHardDay: false,
  });
  assert.equal(checkin.statusCode, 200);
  const practice = checkin.json().suggestedPractice;
  assert.equal(practice.need, 'PLAY');

  const one = (await app.inject({ url: `/api/practices/${practice.id}`, headers: C })).json();
  assert.equal(one.id, practice.id);
  assert.ok(one.steps.length >= 3);

  const done = await post('/api/client/completions', {
    practiceId: practice.id,
    note: 'Потанцевал(а) под любимую песню',
    shareNote: false,
  });
  assert.equal(done.statusCode, 200);
  assert.deepEqual([done.json().scaleBefore, done.json().scaleAfter], [0, 25]);

  const home = (await app.inject({ url: '/api/client/home', headers: C })).json();
  assert.equal(home.mood, 'JOYFUL');
  assert.equal(home.checkedInToday, true);
  assert.equal(home.scales.PLAY, 25);
});

test('повторный чек-ин в тот же день обновляет запись', async () => {
  await post('/api/client/checkin', { mood: 'CALM', lowNeed: 'SAFETY', isHardDay: false });
  await post('/api/client/checkin', { mood: 'HIDING', lowNeed: null, isHardDay: true });
  const rows = await prisma.checkin.findMany();
  assert.equal(rows.length, 1);
  assert.equal(rows[0]!.mood, 'HIDING');
  assert.equal(rows[0]!.isHardDay, true);
  assert.equal(rows[0]!.lowNeed, null);
});

test('чек-ин с назначением психолога предлагает назначенную практику', async () => {
  const client = await prisma.client.findFirstOrThrow();
  await prisma.assignment.create({ data: { clientId: client.id, practiceId: 'say-no' } });
  const r = await post('/api/client/checkin', { mood: 'CALM', lowNeed: 'PLAY', isHardDay: false });
  assert.equal(r.json().suggestedPractice.id, 'say-no');
  const home = (await app.inject({ url: '/api/client/home', headers: C })).json();
  assert.deepEqual(
    home.assignments.map((a: { practice: { id: string } }) => a.practice.id),
    ['say-no'],
  );
});

test('заметка хранится зашифрованной, в истории видна клиенту', async () => {
  await post('/api/client/completions', {
    practiceId: 'emotion-diary',
    note: 'секретная мысль',
    shareNote: true,
  });
  const row = await prisma.completion.findFirstOrThrow();
  assert.ok(row.noteEnc && !row.noteEnc.includes('секретная'));
  assert.equal(row.shareNote, true);

  const history = (await app.inject({ url: '/api/client/history', headers: C })).json();
  assert.equal(history.length, 1);
  assert.equal(history[0].items[0].note, 'секретная мысль');
  assert.equal(history[0].items[0].title, 'Дневник эмоций');
});

test('пустая заметка не помечается «показать психологу»', async () => {
  await post('/api/client/completions', { practiceId: 'safe-place', shareNote: true });
  const row = await prisma.completion.findFirstOrThrow();
  assert.equal(row.noteEnc, null);
  assert.equal(row.shareNote, false);
});

test('шкала не выше 100', async () => {
  for (let i = 0; i < 6; i++) {
    await post('/api/client/completions', { practiceId: 'say-no', shareNote: false });
  }
  const home = (await app.inject({ url: '/api/client/home', headers: C })).json();
  assert.equal(home.scales.LIMITS, 100);
});

test('настройки: напоминание меняется, имя персонажа — нет', async () => {
  const r = await app.inject({
    method: 'PATCH',
    url: '/api/client/settings',
    headers: C,
    payload: { reminderHour: null },
  });
  assert.equal(r.statusCode, 200);
  assert.deepEqual(r.json(), { reminderHour: null, timezone: 'Europe/Moscow' });
  const rename = await app.inject({
    method: 'PATCH',
    url: '/api/client/settings',
    headers: C,
    payload: { characterName: 'Кузя' },
  });
  assert.equal(rename.statusCode, 400);
  const bad = await app.inject({
    method: 'PATCH',
    url: '/api/client/settings',
    headers: C,
    payload: { alias: 'взлом' },
  });
  assert.equal(bad.statusCode, 400);
});

test('удаление данных клиентом удаляет чек-ины, практики, заметки, согласия', async () => {
  const client = await prisma.client.findFirstOrThrow();
  await prisma.consent.create({
    data: { clientId: client.id, type: 'data_processing', version: '1.0' },
  });
  await prisma.assignment.create({ data: { clientId: client.id, practiceId: 'say-no' } });
  await post('/api/client/checkin', { mood: 'CALM', isHardDay: false });
  await post('/api/client/completions', { practiceId: 'say-no', note: 'x', shareNote: true });

  const r = await app.inject({ method: 'DELETE', url: '/api/client/data', headers: C });
  assert.equal(r.statusCode, 200);
  assert.equal(await prisma.checkin.count(), 0);
  assert.equal(await prisma.completion.count(), 0);
  assert.equal(await prisma.consent.count(), 0);
  assert.equal(await prisma.assignment.count(), 0);
  assert.equal(await prisma.client.count(), 0);

  const me = (await app.inject({ url: '/api/me', headers: C })).json();
  assert.equal(me.role, null);
});

test('психолог не может вызывать клиентские эндпоинты', async () => {
  const r = await app.inject({ url: '/api/client/home', headers: as(100) });
  assert.equal(r.statusCode, 403);
});

test('неизвестная практика → 404', async () => {
  const r = await post('/api/client/completions', { practiceId: 'nope', shareNote: false });
  assert.equal(r.statusCode, 404);
});
