import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { as, makeApp, prisma, psychologistAndClient, resetDb } from './helpers.js';

const app = makeApp();
let clientA: string;
let clientB: string;

beforeEach(async () => {
  await resetDb();
  clientA = (await psychologistAndClient(app, 100, 200)).client.id; // психолог A
  clientB = (await psychologistAndClient(app, 101, 201)).client.id; // психолог B
});
after(async () => {
  await app.close();
  await prisma.$disconnect();
});

const A = as(100);
const B = as(101);

test('психолог видит своих клиентов и только их', async () => {
  const listA = (await app.inject({ url: '/api/p/clients', headers: A })).json();
  assert.deepEqual(
    listA.map((c: { id: string }) => c.id),
    [clientA],
  );
  assert.equal(listA[0].lastActivityAt, null);
  const listB = (await app.inject({ url: '/api/p/clients', headers: B })).json();
  assert.deepEqual(
    listB.map((c: { id: string }) => c.id),
    [clientB],
  );
});

test('психолог A не видит сводку, назначения и не снимает назначения клиента B', async () => {
  const summary = await app.inject({ url: `/api/p/clients/${clientB}/summary`, headers: A });
  assert.equal(summary.statusCode, 404);
  const assign = await app.inject({
    method: 'POST',
    url: `/api/p/clients/${clientB}/assignments`,
    headers: A,
    payload: { practiceIds: ['say-no'] },
  });
  assert.equal(assign.statusCode, 404);

  const own = await app.inject({
    method: 'POST',
    url: `/api/p/clients/${clientB}/assignments`,
    headers: B,
    payload: { practiceIds: ['say-no'] },
  });
  assert.equal(own.statusCode, 200);
  const assignment = await prisma.assignment.findFirstOrThrow();
  const del = await app.inject({
    method: 'DELETE',
    url: `/api/p/assignments/${assignment.id}`,
    headers: A,
  });
  assert.equal(del.statusCode, 404);
  assert.equal((await prisma.assignment.findFirstOrThrow()).activeTo, null);
});

test('клиент не может вызывать /api/p/*', async () => {
  const r = await app.inject({ url: '/api/p/clients', headers: as(200) });
  assert.equal(r.statusCode, 403);
});

test('заметки без shareNote не попадают в ответ API', async () => {
  const C = as(200);
  for (const [note, shareNote] of [
    ['видно психологу', true],
    ['личное, только моё', false],
  ] as const) {
    await app.inject({
      method: 'POST',
      url: '/api/client/completions',
      headers: C,
      payload: { practiceId: 'emotion-diary', note, shareNote },
    });
  }
  const res = await app.inject({ url: `/api/p/clients/${clientA}/summary`, headers: A });
  assert.equal(res.statusCode, 200);
  assert.ok(!res.body.includes('личное, только моё'));
  const summary = res.json();
  assert.deepEqual(
    summary.sharedNotes.map((n: { note: string }) => n.note),
    ['видно психологу'],
  );
  assert.equal(summary.completions.length, 2);
  assert.equal(summary.scales.EXPRESSION, 50);
  assert.equal(summary.completionsByNeed.EXPRESSION, 2);
});

test('сводка: чек-ины, трудные дни, период 7/14/30', async () => {
  const C = as(200);
  await app.inject({
    method: 'POST',
    url: '/api/client/checkin',
    headers: C,
    payload: { mood: 'HIDING', isHardDay: true },
  });
  const s = (
    await app.inject({ url: `/api/p/clients/${clientA}/summary?days=14`, headers: A })
  ).json();
  assert.equal(s.days, 14);
  assert.equal(s.checkins, 1);
  assert.equal(s.hardDays.length, 1);
  const bad = await app.inject({ url: `/api/p/clients/${clientA}/summary?days=9`, headers: A });
  assert.equal(bad.statusCode, 400);

  const list = (await app.inject({ url: '/api/p/clients', headers: A })).json();
  assert.ok(list[0].lastActivityAt);
});

test('назначенная практика появляется у клиента, снятая — исчезает', async () => {
  const r = await app.inject({
    method: 'POST',
    url: `/api/p/clients/${clientA}/assignments`,
    headers: A,
    payload: { practiceIds: ['say-no', 'safe-place'] },
  });
  assert.equal(r.json().created, 2);
  const again = await app.inject({
    method: 'POST',
    url: `/api/p/clients/${clientA}/assignments`,
    headers: A,
    payload: { practiceIds: ['say-no'] },
  });
  assert.equal(again.json().created, 0); // без дублей

  let home = (await app.inject({ url: '/api/client/home', headers: as(200) })).json();
  assert.deepEqual(
    home.assignments.map((a: { practice: { id: string } }) => a.practice.id).sort(),
    ['safe-place', 'say-no'],
  );

  const summary = (
    await app.inject({ url: `/api/p/clients/${clientA}/summary`, headers: A })
  ).json();
  const sayNo = summary.assignments.find(
    (a: { practice: { id: string } }) => a.practice.id === 'say-no',
  );
  const del = await app.inject({
    method: 'DELETE',
    url: `/api/p/assignments/${sayNo.id}`,
    headers: A,
  });
  assert.equal(del.statusCode, 200);

  home = (await app.inject({ url: '/api/client/home', headers: as(200) })).json();
  assert.deepEqual(
    home.assignments.map((a: { practice: { id: string } }) => a.practice.id),
    ['safe-place'],
  );
});

test('неизвестная практика при назначении → 400', async () => {
  const r = await app.inject({
    method: 'POST',
    url: `/api/p/clients/${clientA}/assignments`,
    headers: A,
    payload: { practiceIds: ['nope'] },
  });
  assert.equal(r.statusCode, 400);
});
