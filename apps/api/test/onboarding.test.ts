import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { as, makeApp, prisma, psychologistAndClient, resetDb } from './helpers.js';

const app = makeApp();
beforeEach(resetDb);
after(async () => {
  await app.close();
  await prisma.$disconnect();
});

const valid = {
  consents: { dataProcessing: true, shareWithPsychologist: true, crisisNotify: true },
  reminderHour: 20,
  timezone: 'Asia/Yekaterinburg',
};

function onboard(tgId: number, payload: unknown) {
  return app.inject({
    method: 'POST',
    url: '/api/client/onboarding',
    headers: as(tgId),
    payload: payload as object,
  });
}

test('без обязательных согласий пройти нельзя', async () => {
  await psychologistAndClient(app, 100, 200);
  for (const consents of [
    { dataProcessing: false, shareWithPsychologist: true, crisisNotify: true },
    { dataProcessing: true, shareWithPsychologist: false, crisisNotify: false },
    { shareWithPsychologist: true, crisisNotify: false },
  ]) {
    const res = await onboard(200, { ...valid, consents });
    assert.equal(res.statusCode, 400);
  }
  assert.equal(await prisma.consent.count(), 0);
  const client = await prisma.client.findFirstOrThrow();
  assert.equal(client.onboardedAt, null);
});

test('согласия пишутся с version 1.0, onboardedAt выставлен, настройки сохранены', async () => {
  await psychologistAndClient(app, 100, 200);
  const res = await onboard(200, valid);
  assert.equal(res.statusCode, 200);

  const consents = await prisma.consent.findMany({ orderBy: { type: 'asc' } });
  assert.deepEqual(
    consents.map((c) => [c.type, c.version]),
    [
      ['crisis_notify', '1.0'],
      ['data_processing', '1.0'],
      ['share_with_psychologist', '1.0'],
    ],
  );
  const client = await prisma.client.findFirstOrThrow();
  assert.ok(client.onboardedAt);
  assert.equal(client.reminderHour, 20);
  assert.equal(client.timezone, 'Asia/Yekaterinburg');

  const me = (await app.inject({ url: '/api/me', headers: as(200) })).json();
  assert.ok(me.client.onboardedAt);
});

test('без согласия на уведомление психолога — только два согласия', async () => {
  await psychologistAndClient(app, 100, 200);
  const res = await onboard(200, {
    ...valid,
    consents: { ...valid.consents, crisisNotify: false },
    reminderHour: null,
  });
  assert.equal(res.statusCode, 200);
  assert.equal(await prisma.consent.count({ where: { type: 'crisis_notify' } }), 0);
  assert.equal(await prisma.consent.count(), 2);
});

test('повторный онбординг → 409, психолог → 403, неизвестная таймзона → 400', async () => {
  await psychologistAndClient(app, 100, 200);
  assert.equal((await onboard(200, { ...valid, timezone: 'Mars/Olympus' })).statusCode, 400);
  assert.equal((await onboard(200, valid)).statusCode, 200);
  assert.equal((await onboard(200, valid)).statusCode, 409);
  assert.equal((await onboard(100, valid)).statusCode, 403);
});
