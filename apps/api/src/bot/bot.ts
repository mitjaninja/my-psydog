import { Bot, InlineKeyboard } from 'grammy';
import { OPEN_APP_LABEL } from '../notifier.js';

const INVITE_RE = /^inv_[A-Za-z0-9_-]{10}$/;

/** Ответ на /start [payload]: приветствие и кнопка web_app (с приглашением, если оно есть). */
export function startReply(payload: string, webAppUrl: string) {
  const invite = INVITE_RE.test(payload) ? payload : null;
  const url = invite ? `${webAppUrl}?startapp=${invite}` : webAppUrl;
  const text = invite
    ? 'Привет! Тебя пригласили познакомиться с малышом — небольшим другом для практик между встречами с психологом. Нажми кнопку ниже.'
    : 'Привет! Здесь живёт малыш, о котором можно заботиться между встречами с психологом. Нажми кнопку ниже, чтобы открыть его.';
  return { text, keyboard: new InlineKeyboard().webApp(OPEN_APP_LABEL, url) };
}

export function createBot(token: string, webAppUrl: string) {
  const bot = new Bot(token);

  bot.command('start', async (ctx) => {
    const { text, keyboard } = startReply(ctx.match.trim(), webAppUrl);
    await ctx.reply(text, { reply_markup: keyboard });
  });

  bot.catch((err) => console.error('bot error', err.error));
  return bot;
}

/** Кнопка меню бота → Mini App. */
export async function setupMenuButton(bot: Bot, webAppUrl: string) {
  await bot.api.setChatMenuButton({
    menu_button: { type: 'web_app', text: 'Малыш', web_app: { url: webAppUrl } },
  });
}
