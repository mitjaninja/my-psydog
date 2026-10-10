import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decryptNote, encryptNote, parseNotesKey } from '../src/lib/notes.js';
import { computeScales } from '../src/client/scales.js';
import { suggestPractice, type SuggestPractice } from '../src/client/suggest.js';
import { localDateString, localHour } from '../src/lib/dates.js';

const key = parseNotesKey(Buffer.alloc(32, 1).toString('base64'));

test('заметка шифруется AES-256-GCM и расшифровывается', () => {
  const enc = encryptNote('Сегодня было тепло', key);
  assert.ok(enc.startsWith('v1:'));
  assert.ok(!enc.includes('тепло'));
  assert.notEqual(enc, encryptNote('Сегодня было тепло', key)); // случайный IV
  assert.equal(decryptNote(enc, key), 'Сегодня было тепло');
  assert.throws(() => decryptNote(enc, parseNotesKey(Buffer.alloc(32, 2).toString('base64'))));
});

test('ключ не 32 байта — ошибка', () => {
  assert.throws(() => parseNotesKey(Buffer.alloc(16).toString('base64')));
});

test('шкалы: +25 за практику, максимум 100, пустые — 0', () => {
  const s = computeScales(['PLAY', 'PLAY', 'SAFETY', 'PLAY', 'PLAY', 'PLAY']);
  assert.deepEqual(s, { SAFETY: 25, AUTONOMY: 0, EXPRESSION: 0, PLAY: 100, LIMITS: 0 });
});

const P = (id: string, need: SuggestPractice['need'], isComforting = false) => ({
  id,
  need,
  isComforting,
});
const library = [
  P('critic-shield', 'SAFETY', true),
  P('safe-place', 'SAFETY', true),
  P('ten-min-joy', 'PLAY', true),
  P('small-step', 'AUTONOMY'),
  P('say-no', 'LIMITS'),
  P('emotion-diary', 'EXPRESSION'),
];
const first = () => 0;

test('подбор: SCARED → critic-shield', () => {
  const r = suggestPractice({ mood: 'SCARED', lowNeed: 'PLAY', isHardDay: false }, library, []);
  assert.equal(r?.id, 'critic-shield');
});

test('подбор: тяжёлый день или HIDING → утешающая, даже если есть назначения', () => {
  const assigned = [library[3]!];
  for (const input of [
    { mood: 'CALM' as const, lowNeed: 'AUTONOMY' as const, isHardDay: true },
    { mood: 'HIDING' as const, lowNeed: null, isHardDay: false },
  ]) {
    for (let i = 0; i < 20; i++) {
      const r = suggestPractice(input, library, assigned);
      assert.ok(r?.isComforting, `${r?.id} не утешающая`);
    }
  }
});

test('подбор: назначение с той же lowNeed, затем любое назначение', () => {
  const assigned = [library[4]!, library[3]!]; // say-no (LIMITS), small-step (AUTONOMY)
  assert.equal(
    suggestPractice(
      { mood: 'CALM', lowNeed: 'AUTONOMY', isHardDay: false },
      library,
      assigned,
      first,
    )?.id,
    'small-step',
  );
  assert.equal(
    suggestPractice({ mood: 'JOYFUL', lowNeed: 'PLAY', isHardDay: false }, library, assigned, first)
      ?.id,
    'say-no',
  );
});

test('подбор: без назначений — практика с need = lowNeed', () => {
  const r = suggestPractice({ mood: 'CALM', lowNeed: 'EXPRESSION', isHardDay: false }, library, []);
  assert.equal(r?.id, 'emotion-diary');
});

test('локальная дата и час в таймзоне клиента', () => {
  const t = new Date('2026-03-01T21:30:00Z');
  assert.equal(localDateString('Europe/Moscow', t), '2026-03-02');
  assert.equal(localDateString('America/New_York', t), '2026-03-01');
  assert.equal(localHour('Europe/Moscow', t), 0);
  assert.equal(localHour('Asia/Yekaterinburg', t), 2);
});

test('production без BOT_TOKEN или NOTES_ENCRYPTION_KEY не стартует', async () => {
  const { loadConfig } = await import('../src/config.js');
  const key = Buffer.alloc(32, 3).toString('base64');
  assert.throws(
    () => loadConfig({ NODE_ENV: 'production', NOTES_ENCRYPTION_KEY: key }),
    /BOT_TOKEN/,
  );
  assert.throws(
    () => loadConfig({ NODE_ENV: 'production', BOT_TOKEN: '1:x' }),
    /NOTES_ENCRYPTION_KEY/,
  );
  assert.ok(loadConfig({ NODE_ENV: 'production', BOT_TOKEN: '1:x', NOTES_ENCRYPTION_KEY: key }));
  assert.equal(loadConfig({ NODE_ENV: 'development' }).isDev, true);
});
