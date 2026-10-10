// Конфиг из окружения. .env подхватывает dotenv-cli в скриптах package.json.

export interface Config {
  nodeEnv: string;
  isDev: boolean;
  botToken: string;
  botUsername: string;
  port: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const nodeEnv = env.NODE_ENV ?? 'production';
  const isDev = nodeEnv === 'development';
  const botToken = env.BOT_TOKEN ?? '';
  // В dev можно работать без бота через X-Dev-Tg-Id; в production без токена не стартуем.
  if (!botToken && !isDev) throw new Error('BOT_TOKEN is required');
  return {
    nodeEnv,
    isDev,
    botToken,
    botUsername: env.BOT_USERNAME ?? '',
    port: Number(env.PORT ?? 3000),
  };
}
