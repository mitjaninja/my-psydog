import cron from 'node-cron';
import { buildApp } from './app.js';
import { createBot, setupMenuButton } from './bot/bot.js';
import { loadConfig } from './config.js';
import { prisma } from './db.js';
import { logNotifier, telegramNotifier, type Notifier } from './notifier.js';
import { runReminders } from './reminders.js';

const config = loadConfig();
const bot = config.botToken ? createBot(config.botToken, config.webAppUrl) : null;
const notifier: Notifier = bot
  ? telegramNotifier(bot.api, (e) => console.error('telegram send failed', e))
  : logNotifier((m) => console.log(m));
const app = buildApp({ config, prisma, notifier });

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

if (bot) {
  if (config.webAppUrl.startsWith('https://')) {
    await setupMenuButton(bot, config.webAppUrl).catch((e) =>
      app.log.error(e, 'setChatMenuButton failed'),
    );
  } else {
    app.log.warn('WEBAPP_URL must be https:// — menu button and web_app buttons will not work');
  }
  // Long polling в том же процессе
  bot
    .start({ onStart: (me) => app.log.info(`bot @${me.username} started`) })
    .catch((e) => app.log.error(e, 'bot stopped — API keeps working'));
} else {
  app.log.warn('BOT_TOKEN is empty — bot is off, notifications go to the log');
}

// Раз в час, в начале часа
const reminders = cron.schedule('0 * * * *', () => {
  runReminders({ prisma, notifier, webAppUrl: config.webAppUrl })
    .then((sent) => sent.length && app.log.info({ sent: sent.length }, 'reminders sent'))
    .catch((e) => app.log.error(e, 'reminders failed'));
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    reminders.stop();
    void Promise.resolve(bot?.stop())
      .then(() => app.close())
      .then(() => prisma.$disconnect())
      .then(() => process.exit(0));
  });
}
