import type { PrismaClient } from '@prisma/client';
import { DAY_MS, localDate, localDateString, localHour } from './lib/dates.js';
import type { Notifier } from './notifier.js';

export const PAUSE_AFTER_DAYS = 3;

// Мягкие фразы: без «не забудь», «ты пропустил». TODO: проверка схема-терапевтом.
export const REMINDER_PHRASES = [
  'Малыш тебя ждёт, когда будет минутка.',
  'Загляни к малышу, если захочется. Он будет рад.',
  'Малыш машет лапкой. Как ты сегодня?',
  'Если найдётся пара минут — малыш рядом.',
  'Малыш соскучился. Заглянешь?',
  'Немного заботы о себе сегодня? Малыш тут.',
];
export const PAUSE_PHRASE = 'Мы тут, когда захочешь вернуться. Малыш всегда рад тебя видеть.';

export type ReminderDecision = 'none' | 'gentle' | 'pause';

export interface ReminderState {
  timezone: string;
  reminderHour: number | null;
  checkedInToday: boolean;
  lastActivityAt: Date | null;
  lastReminderAt: Date | null;
  remindersPausedAt: Date | null;
}

export function decideReminder(s: ReminderState, now: Date): ReminderDecision {
  if (s.reminderHour === null || localHour(s.timezone, now) !== s.reminderHour) return 'none';
  if (s.checkedInToday) return 'none';
  // Не больше одного сообщения в день
  if (
    s.lastReminderAt &&
    localDateString(s.timezone, s.lastReminderAt) === localDateString(s.timezone, now)
  ) {
    return 'none';
  }
  // На паузе, пока человек сам не вернётся
  const paused =
    s.remindersPausedAt && (!s.lastActivityAt || s.lastActivityAt <= s.remindersPausedAt);
  if (paused) return 'none';
  const inactiveMs = now.getTime() - (s.lastActivityAt?.getTime() ?? now.getTime());
  return inactiveMs >= PAUSE_AFTER_DAYS * DAY_MS ? 'pause' : 'gentle';
}

/** Раз в час: отправить напоминания тем, у кого сейчас их локальный час. */
export async function runReminders(
  deps: { prisma: PrismaClient; notifier: Notifier; webAppUrl: string },
  now = new Date(),
  rng: () => number = Math.random,
) {
  const { prisma, notifier } = deps;
  const clients = await prisma.client.findMany({
    where: { reminderHour: { not: null }, onboardedAt: { not: null } },
    include: {
      user: true,
      checkins: { orderBy: { createdAt: 'desc' }, take: 1 },
      completions: { orderBy: { completedAt: 'desc' }, take: 1 },
    },
  });

  const sent: { clientId: string; decision: ReminderDecision }[] = [];
  for (const c of clients) {
    const lastCheckin = c.checkins[0];
    const activity = [lastCheckin?.createdAt, c.completions[0]?.completedAt, c.onboardedAt]
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    const decision = decideReminder(
      {
        timezone: c.timezone,
        reminderHour: c.reminderHour,
        checkedInToday: lastCheckin?.date.getTime() === localDate(c.timezone, now).getTime(),
        lastActivityAt: activity ?? null,
        lastReminderAt: c.lastReminderAt,
        remindersPausedAt: c.remindersPausedAt,
      },
      now,
    );
    if (decision === 'none') continue;

    const text =
      decision === 'pause'
        ? PAUSE_PHRASE
        : REMINDER_PHRASES[Math.floor(rng() * REMINDER_PHRASES.length)]!;
    // Отметку ставим до отправки: даже если Telegram не доставит, повторять в этот день не будем
    await prisma.client.update({
      where: { id: c.id },
      data: {
        lastReminderAt: now,
        ...(decision === 'pause' ? { remindersPausedAt: now } : {}),
      },
    });
    await notifier.send(c.user.tgId, text, { webAppUrl: deps.webAppUrl });
    sent.push({ clientId: c.id, decision });
  }
  return sent;
}
