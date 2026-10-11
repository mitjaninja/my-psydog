import { Api, InlineKeyboard } from 'grammy';

export interface SendOptions {
  /** Добавить кнопку, открывающую Mini App. */
  webAppUrl?: string;
}

/** Отправка сообщений пользователям в Telegram. В тестах — фейк. */
export interface Notifier {
  send(tgId: bigint, text: string, opts?: SendOptions): Promise<boolean>;
}

export const OPEN_APP_LABEL = 'К Пушку';

export function telegramNotifier(api: Api, log: (e: unknown) => void): Notifier {
  return {
    async send(tgId, text, opts) {
      try {
        await api.sendMessage(Number(tgId), text, {
          ...(opts?.webAppUrl
            ? { reply_markup: new InlineKeyboard().webApp(OPEN_APP_LABEL, opts.webAppUrl) }
            : {}),
        });
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
