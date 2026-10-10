import { Api } from 'grammy';

/** Отправка сообщений пользователям в Telegram. В тестах — фейк. */
export interface Notifier {
  send(tgId: bigint, text: string): Promise<boolean>;
}

export function telegramNotifier(botToken: string, log: (e: unknown) => void): Notifier {
  const api = new Api(botToken);
  return {
    async send(tgId, text) {
      try {
        await api.sendMessage(Number(tgId), text);
        return true;
      } catch (err) {
        // Например, психолог ни разу не открыл чат с ботом — Telegram не даст написать первым
        log(err);
        return false;
      }
    },
  };
}

/** Без BOT_TOKEN (dev): пишет в лог вместо Telegram. */
export function logNotifier(log: (msg: string) => void): Notifier {
  return {
    async send(tgId, text) {
      log(`[notify ${tgId}] ${text}`);
      return true;
    },
  };
}
