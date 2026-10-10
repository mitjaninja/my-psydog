import { parse, validate } from '@telegram-apps/init-data-node';

export const INIT_DATA_MAX_AGE_SEC = 24 * 60 * 60;

export interface TelegramIdentity {
  tgId: bigint;
  firstName: string | null;
  startParam: string | null;
}

export class AuthError extends Error {}

/**
 * Проверяет подпись initData (HMAC-SHA256, ключ = HMAC("WebAppData", BOT_TOKEN))
 * и срок auth_date ≤ 24 ч. Бросает AuthError на любой проблеме.
 */
export function verifyInitData(raw: string, botToken: string): TelegramIdentity {
  if (!botToken) throw new AuthError('Bot token is not configured');
  try {
    validate(raw, botToken, { expiresIn: INIT_DATA_MAX_AGE_SEC });
  } catch (err) {
    throw new AuthError(`Invalid init data: ${(err as Error).message}`);
  }
  const data = parse(raw);
  if (!data.user) throw new AuthError('Init data has no user');
  return {
    tgId: BigInt(data.user.id),
    firstName: data.user.first_name ?? null,
    startParam: data.start_param ?? null,
  };
}

/**
 * Достаёт личность из заголовков запроса.
 * `Authorization: tma <initDataRaw>` — всегда; `X-Dev-Tg-Id` — только в development.
 */
export function identityFromHeaders(
  headers: Record<string, string | string[] | undefined>,
  opts: { botToken: string; isDev: boolean },
): TelegramIdentity {
  const auth = headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('tma ')) {
    return verifyInitData(auth.slice(4), opts.botToken);
  }
  const devId = headers['x-dev-tg-id'];
  if (opts.isDev && typeof devId === 'string' && /^\d{1,20}$/.test(devId)) {
    return { tgId: BigInt(devId), firstName: null, startParam: null };
  }
  throw new AuthError('Missing authorization');
}
