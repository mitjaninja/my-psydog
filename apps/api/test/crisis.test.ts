import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { hasCrisisKeywords, normalizeText } from '../src/crisis/keywords.js';
import { as, fakeNotifier, makeApp, prisma, psychologistAndClient, resetDb } from './helpers.js';

const notifier = fakeNotifier();
const app = makeApp(notifier);
beforeEach(async () => {
  notifier.sent.length = 0;
  await resetDb();
  await psychologistAndClient(app, 100, 200);
});
after(async () => {
  await app.close();
  await prisma.$disconnect();
});

const C = as(200);

async function giveConsent(type: string) {
  const client = await prisma.client.findFirstOrThrow();
  await prisma.consent.create({ data: { clientId: client.id, type, version: '1.0' } });
}

test('детектор: регистр, ё/е, словоформы', () => {
  assert.ok(hasCrisisKeywords('Иногда я НЕ ХОЧУ ЖИТЬ'));
  assert.ok(hasCrisisKeywords('думаю о том, чтобы свести счёты с жизнью'));
  assert.ok(hasCrisisKeywords('суицидальные мысли'));
  assert.ok(hasCrisisKeywords('не  хочу\nжить'));
  assert.ok(!hasCrisisKeywords('Сегодня хочу жить по-новому и радоваться'));
  assert.ok(!hasCrisisKeywords(''));
  assert.ok(!hasCrisisKeywords(undefined));
  assert.equal(normalizeText('  Ёлка  ЁЖ '), 'елка еж');
});

test('кнопка с согласием: CrisisEvent(button) и сообщение психологу без деталей', async () => {
  await giveConsent('crisis_notify');
  const r = await app.inject({ method: 'POST', url: '/api/client/crisis', headers: C });
  assert.equal(r.statusCode, 200);
  const ev = await prisma.crisisEvent.findFirstOrThrow();
  assert.equal(ev.source, 'button');
  assert.equal(ev.notified, true);
  assert.equal(notifier.sent.length, 1);
  assert.equal(notifier.sent[0]!.tgId, 100n);
  assert.equal(notifier.sent[0]!.text, 'А., вторник отметил(а), что ему(ей) сейчас очень плохо.');
});

test('кнопка без согласия: событие есть, сообщения нет', async () => {
  await app.inject({ method: 'POST', url: '/api/client/crisis', headers: C });
  const ev = await prisma.crisisEvent.findFirstOrThrow();
  assert.equal(ev.notified, false);
  assert.equal(notifier.sent.length, 0);
});

test('отозванное согласие не даёт уведомления', async () => {
  await giveConsent('crisis_notify');
  await prisma.consent.updateMany({ data: { revokedAt: new Date() } });
  await app.inject({ method: 'POST', url: '/api/client/crisis', headers: C });
  assert.equal(notifier.sent.length, 0);
});

test('ключевые слова в заметке → showCrisis и CrisisEvent(keyword)', async () => {
  const r = await app.inject({
    method: 'POST',
    url: '/api/client/completions',
    headers: C,
    payload: { practiceId: 'emotion-diary', note: 'Иногда не хочется жить', shareNote: false },
  });
  assert.equal(r.statusCode, 200);
  assert.equal(r.json().showCrisis, true);
  const ev = await prisma.crisisEvent.findFirstOrThrow();
  assert.equal(ev.source, 'keyword');
  assert.equal(await prisma.completion.count(), 1); // практика всё равно сохранена
});

test('обычная заметка → без кризисного экрана', async () => {
  const r = await app.inject({
    method: 'POST',
    url: '/api/client/completions',
    headers: C,
    payload: { practiceId: 'emotion-diary', note: 'Было спокойно', shareNote: false },
  });
  assert.equal(r.json().showCrisis, false);
  assert.equal(await prisma.crisisEvent.count(), 0);
});
