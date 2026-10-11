import { after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { as, makeApp, prisma, psychologistWithInvite, resetDb } from './helpers.js';

const app = makeApp();
beforeEach(resetDb);
after(async () => {
  await app.close();
  await prisma.$disconnect();
});

test('психолог регистрируется, создаёт ссылку; клиент принимает и привязывается', async () => {
  const reg = await app.inject({
    method: 'POST',
    url: '/api/psychologist/register',
    headers: as(100),
    payload: { displayName: 'Мария' },
  });
  assert.equal(reg.statusCode, 200);

  const inv = await app.inject({
    method: 'POST',
    url: '/api/invites',
    headers: as(100),
    payload: { alias: 'А., вторник' },
  });
  assert.equal(inv.statusCode, 200);
  const { code, link } = inv.json();
  assert.match(code, /^[A-Za-z0-9_-]{10}$/);
  assert.equal(link, `https://t.me/psydog_test_bot/app?startapp=inv_${code}`);

  const meBefore = await app.inject({
    url: '/api/me',
    headers: as(200, { startParam: `inv_${code}` }),
  });
  assert.equal(meBefore.json().role, null);
  assert.equal(meBefore.json().startParam, `inv_${code}`);

  const accept = await app.inject({
    method: 'POST',
    url: `/api/invites/${code}/accept`,
    headers: as(200),
  });
  assert.equal(accept.statusCode, 200);
  assert.equal(accept.json().psychologistName, 'Мария');

  const me = (await app.inject({ url: '/api/me', headers: as(200) })).json();
  assert.equal(me.role, 'CLIENT');
  assert.equal(me.client.characterName, 'Пушок');

  const client = await prisma.client.findFirstOrThrow({ include: { psychologist: true } });
  assert.equal(client.alias, 'А., вторник');
  assert.equal(client.psychologist.displayName, 'Мария');

  const psyMe = (await app.inject({ url: '/api/me', headers: as(100) })).json();
  assert.equal(psyMe.role, 'PSYCHOLOGIST');
  assert.equal(psyMe.psychologist.displayName, 'Мария');
});

test('повторное использование кода → 409', async () => {
  const code = await psychologistWithInvite(app, 100);
  const first = await app.inject({
    method: 'POST',
    url: `/api/invites/${code}/accept`,
    headers: as(200),
  });
  assert.equal(first.statusCode, 200);
  const second = await app.inject({
    method: 'POST',
    url: `/api/invites/${code}/accept`,
    headers: as(300),
  });
  assert.equal(second.statusCode, 409);
  assert.equal(second.json().error, 'invite_used');
});

test('просроченный код → 410, неизвестный → 404', async () => {
  const code = await psychologistWithInvite(app, 100);
  await prisma.invite.update({ where: { code }, data: { expiresAt: new Date(Date.now() - 1000) } });
  const expired = await app.inject({
    method: 'POST',
    url: `/api/invites/${code}/accept`,
    headers: as(200),
  });
  assert.equal(expired.statusCode, 410);
  const unknown = await app.inject({
    method: 'POST',
    url: '/api/invites/nope123456/accept',
    headers: as(200),
  });
  assert.equal(unknown.statusCode, 404);
});

test('психолог не может принять приглашение, клиент не может создавать приглашения', async () => {
  const code = await psychologistWithInvite(app, 100);
  const selfAccept = await app.inject({
    method: 'POST',
    url: `/api/invites/${code}/accept`,
    headers: as(100),
  });
  assert.equal(selfAccept.statusCode, 409);

  await app.inject({ method: 'POST', url: `/api/invites/${code}/accept`, headers: as(200) });
  const clientInvite = await app.inject({
    method: 'POST',
    url: '/api/invites',
    headers: as(200),
    payload: { alias: 'x' },
  });
  assert.equal(clientInvite.statusCode, 403);
});

test('повторная регистрация психологом → 409, пустое имя → 400', async () => {
  const empty = await app.inject({
    method: 'POST',
    url: '/api/psychologist/register',
    headers: as(100),
    payload: { displayName: '  ' },
  });
  assert.equal(empty.statusCode, 400);
  await psychologistWithInvite(app, 100);
  const again = await app.inject({
    method: 'POST',
    url: '/api/psychologist/register',
    headers: as(100),
    payload: { displayName: 'Ещё раз' },
  });
  assert.equal(again.statusCode, 409);
});

test('пустое JSON-тело — 4xx, а не 500', async () => {
  const code = await psychologistWithInvite(app, 100);
  const res = await app.inject({
    method: 'POST',
    url: `/api/invites/${code}/accept`,
    headers: { ...as(200), 'content-type': 'application/json' },
  });
  assert.equal(res.statusCode, 400);
});
