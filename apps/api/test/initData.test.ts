import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sign } from '@telegram-apps/init-data-node';
import { AuthError, identityFromHeaders, verifyInitData } from '../src/auth/initData.js';

const BOT_TOKEN = '123456:TEST-bot-token';

function signed(authDate = new Date(), token = BOT_TOKEN) {
  return sign(
    {
      user: { id: 777000111, first_name: 'Аня' },
      start_param: 'inv_abc123defg',
      signature: 'test-signature',
    },
    token,
    authDate,
  );
}

test('корректная initData проходит и даёт tgId, имя и startParam', () => {
  const id = verifyInitData(signed(), BOT_TOKEN);
  assert.equal(id.tgId, 777000111n);
  assert.equal(id.firstName, 'Аня');
  assert.equal(id.startParam, 'inv_abc123defg');
});

test('подделанная initData отклоняется', () => {
  const forged = signed().replace('777000111', '777000112');
  assert.throws(() => verifyInitData(forged, BOT_TOKEN), AuthError);
});

test('initData, подписанная чужим токеном, отклоняется', () => {
  assert.throws(() => verifyInitData(signed(new Date(), '999:other'), BOT_TOKEN), AuthError);
});

test('initData старше 24 часов отклоняется', () => {
  const old = new Date(Date.now() - 25 * 60 * 60 * 1000);
  assert.throws(() => verifyInitData(signed(old), BOT_TOKEN), AuthError);
});

test('заголовок Authorization: tma принимается', () => {
  const id = identityFromHeaders(
    { authorization: `tma ${signed()}` },
    { botToken: BOT_TOKEN, isDev: false },
  );
  assert.equal(id.tgId, 777000111n);
});

test('X-Dev-Tg-Id работает только в development', () => {
  const headers = { 'x-dev-tg-id': '42' };
  assert.equal(identityFromHeaders(headers, { botToken: BOT_TOKEN, isDev: true }).tgId, 42n);
  assert.throws(
    () => identityFromHeaders(headers, { botToken: BOT_TOKEN, isDev: false }),
    AuthError,
  );
});

test('без заголовков — отказ', () => {
  assert.throws(() => identityFromHeaders({}, { botToken: BOT_TOKEN, isDev: true }), AuthError);
});
