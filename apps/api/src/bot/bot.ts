import { Bot, InlineKeyboard } from 'grammy';
import { OPEN_APP_LABEL } from '../notifier.js';

const INVITE_RE = /^inv_[A-Za-z0-9_-]{10}$/;

/** Ответ на /start [payload]: приветствие и кнопка web_app (с приглашением, если оно есть). */
export function startReply(payload: string, webAppUrl: string) {
  const invite = INVITE_RE.test(payload) ? payload : null;
  const url = invite ? `${webAppUrl}?startapp=${invite}` : webAppUrl;
  const text = invite
    ? 'Привет! Тебя пригласили познакомиться с Пушком — небольшим другом для практик между встречами с психологом. Нажми кнопку ниже.'
    : 'Привет! Здесь живёт Пушок — малыш, о котором можно заботиться между встречами с психологом. Нажми кнопку ниже, чтобы открыть его.';
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

/** Профиль бота. Лимиты Telegram: имя ≤ 64, описание ≤ 512, короткое описание ≤ 120. */
export const BOT_PROFILE = {
  name: 'Пушок — забота о себе',
  // «Что умеет этот бот?» — видно в пустом чате до нажатия «Старт»
  description:
    'Привет! Я Пушок — маленький друг, о котором можно заботиться между встречами с психологом.\n\n' +
    'Раз в день я спрошу, как ты, и предложу небольшую практику на 2–10 минут. ' +
    'Пропускать можно — я всегда рад тебя видеть.\n\n' +
    'Вход — по приглашению от психолога. Пушок не заменяет терапию и экстренную помощь.',
  // В профиле бота и при пересылке ссылки на него
  shortDescription:
    'Короткие практики заботы о себе между встречами с психологом. Бережно и без чувства вины.',
};

/** Кнопка меню бота → Mini App; имя и описания — из BOT_PROFILE, если отличаются. */
export async function setupBotProfile(bot: Bot, webAppUrl: string) {
  await bot.api.setChatMenuButton({
    menu_button: { type: 'web_app', text: 'Пушок', web_app: { url: webAppUrl } },
  });
  const [name, description, short] = await Promise.all([
    bot.api.getMyName(),
    bot.api.getMyDescription(),
    bot.api.getMyShortDescription(),
  ]);
  if (name.name !== BOT_PROFILE.name) await bot.api.setMyName(BOT_PROFILE.name);
  if (description.description !== BOT_PROFILE.description) {
    await bot.api.setMyDescription(BOT_PROFILE.description);
  }
  if (short.short_description !== BOT_PROFILE.shortDescription) {
    await bot.api.setMyShortDescription(BOT_PROFILE.shortDescription);
  }
}
