// Общие помощники интеграционных тестов. База — из .env.test (app_test).
import { PrismaClient } from '@prisma/client';
import { sign } from '@telegram-apps/init-data-node';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { seedPractices } from '../prisma/seed.js';

export const prisma = new PrismaClient();
export const config = loadConfig(process.env);

/** Фейковый notifier: копит отправленные сообщения. */
export function fakeNotifier() {
  const sent: { tgId: bigint; text: string }[] = [];
  return {
    sent,
    async send(tgId: bigint, text: string) {
      sent.push({ tgId, text });
      return true;
    },
  };
}

export function makeApp(notifier = fakeNotifier()) {
  return buildApp({ config, prisma, logger: false, notifier });
}

/** Чистит все таблицы и заново кладёт практики. */
export async function resetDb() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE "CrisisEvent", "Consent", "Completion", "Checkin", "Assignment",
             "Invite", "Client", "Psychologist", "User", "Practice" CASCADE
  `);
  await seedPractices(prisma);
}

/** Заголовки с настоящей подписанной initData для пользователя tgId. */
export function as(tgId: number, opts: { firstName?: string; startParam?: string } = {}) {
  const raw = sign(
    {
      user: { id: tgId, first_name: opts.firstName ?? `User${tgId}` },
      ...(opts.startParam ? { start_param: opts.startParam } : {}),
      signature: 'test',
    },
    config.botToken,
    new Date(),
  );
  return { authorization: `tma ${raw}` };
}

type App = ReturnType<typeof makeApp>;

/** Регистрирует психолога и создаёт приглашение; возвращает код. */
export async function psychologistWithInvite(app: App, tgId: number, alias = 'А., вторник') {
  await app.inject({
    method: 'POST',
    url: '/api/psychologist/register',
    headers: as(tgId),
    payload: { displayName: `Психолог ${tgId}` },
  });
  const res = await app.inject({
    method: 'POST',
    url: '/api/invites',
    headers: as(tgId),
    payload: { alias },
  });
  return res.json<{ code: string; link: string }>().code;
}

/** Психолог + клиент, принявший приглашение. */
export async function psychologistAndClient(app: App, psyTgId: number, clientTgId: number) {
  const code = await psychologistWithInvite(app, psyTgId);
  await app.inject({
    method: 'POST',
    url: `/api/invites/${code}/accept`,
    headers: as(clientTgId),
  });
  const client = await prisma.client.findFirstOrThrow({
    where: { user: { tgId: BigInt(clientTgId) } },
  });
  return { code, client };
}
