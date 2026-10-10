// Конфиг из окружения. .env подхватывает dotenv-cli в скриптах package.json.
import { parseNotesKey } from './lib/notes.js';

// Только для dev без ключа в .env: заметки шифруются, но этим ключом. В production ключ обязателен.
const DEV_NOTES_KEY = Buffer.alloc(32, 7).toString('base64');

export interface Config {
  nodeEnv: string;
  isDev: boolean;
  botToken: string;
  botUsername: string;
  notesKey: Buffer;
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const nodeEnv = env.NODE_ENV ?? 'production';
  const isDev = nodeEnv === 'development';
  const botToken = env.BOT_TOKEN ?? '';
  // В dev можно работать без бота через X-Dev-Tg-Id; в production без токена не стартуем.
  if (!botToken && !isDev) throw new Error('BOT_TOKEN is required');
  const rawKey = env.NOTES_ENCRYPTION_KEY?.trim();
  if (!rawKey && !isDev) throw new Error('NOTES_ENCRYPTION_KEY is required');
  return {
    nodeEnv,
    isDev,
    botToken,
    botUsername: env.BOT_USERNAME ?? '',
    notesKey: parseNotesKey(rawKey || DEV_NOTES_KEY),
    port: Number(env.PORT ?? 3000),
  };
}
