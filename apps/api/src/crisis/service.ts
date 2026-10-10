import type { Client, PrismaClient } from '@prisma/client';
import type { Notifier } from '../notifier.js';

export type CrisisSource = 'button' | 'keyword';

export function crisisMessage(alias: string): string {
  // Без деталей и заметок — только факт
  return `${alias} отметил(а), что ему(ей) сейчас очень плохо.`;
}

/**
 * Записывает CrisisEvent. Для кнопки — при согласии crisis_notify отправляет
 * психологу короткое сообщение (согласие сформулировано именно про кнопку).
 */
export async function recordCrisis(
  deps: { prisma: PrismaClient; notifier: Notifier },
  client: Client,
  source: CrisisSource,
): Promise<{ notified: boolean }> {
  const { prisma, notifier } = deps;
  const event = await prisma.crisisEvent.create({ data: { clientId: client.id, source } });
  if (source !== 'button') return { notified: false };

  const consent = await prisma.consent.findFirst({
    where: { clientId: client.id, type: 'crisis_notify', revokedAt: null },
  });
  if (!consent) return { notified: false };

  const psychologist = await prisma.psychologist.findUniqueOrThrow({
    where: { id: client.psychologistId },
    include: { user: true },
  });
  const notified = await notifier.send(psychologist.user.tgId, crisisMessage(client.alias));
  if (notified) {
    await prisma.crisisEvent.update({ where: { id: event.id }, data: { notified: true } });
  }
  return { notified };
}
