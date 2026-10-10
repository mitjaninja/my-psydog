import type { FastifyInstance } from 'fastify';
import type { Client, PrismaClient } from '@prisma/client';
import {
  checkinBody,
  completionBody,
  settingsBody,
  type CheckinResponse,
  type ClientHomeResponse,
  type ClientSettings,
  type CompletionResponse,
  type HistoryDay,
  type Need,
} from '@psydog/shared';
import { currentClient } from '../auth/guards.js';
import { HttpError } from '../errors.js';
import { DAY_MS, localDate, localDateString } from '../lib/dates.js';
import { decryptNote, encryptNote } from '../lib/notes.js';
import { computeScales, SCALE_WINDOW_DAYS } from '../client/scales.js';
import { suggestPractice } from '../client/suggest.js';
import { toPracticeDto } from '../client/practices.js';

export interface ClientRouteDeps {
  prisma: PrismaClient;
  notesKey: Buffer;
  /** Хук после сохранения практики — шаг 8 (кризисные слова). */
  afterCompletion?: (client: Client, note: string | undefined) => Promise<boolean>;
  rng?: () => number;
}

/** Назначения, активные сейчас. */
export function activeAssignmentsWhere(clientId: string, now = new Date()) {
  return {
    clientId,
    activeFrom: { lte: now },
    OR: [{ activeTo: null }, { activeTo: { gt: now } }],
    practice: { isActive: true },
  };
}

async function recentNeeds(prisma: PrismaClient, clientId: string, now = new Date()) {
  const rows = await prisma.completion.findMany({
    where: { clientId, completedAt: { gt: new Date(now.getTime() - SCALE_WINDOW_DAYS * DAY_MS) } },
    select: { practice: { select: { need: true } } },
  });
  return rows.map((r) => r.practice.need as Need);
}

export function registerClientRoutes(app: FastifyInstance, deps: ClientRouteDeps) {
  const { prisma, notesKey } = deps;

  app.get('/api/client/home', async (request): Promise<ClientHomeResponse> => {
    const client = await currentClient(prisma, request);
    const [checkin, needs, assignments] = await Promise.all([
      prisma.checkin.findUnique({
        where: { clientId_date: { clientId: client.id, date: localDate(client.timezone) } },
      }),
      recentNeeds(prisma, client.id),
      prisma.assignment.findMany({
        where: activeAssignmentsWhere(client.id),
        include: { practice: true },
        orderBy: { activeFrom: 'desc' },
      }),
    ]);
    return {
      characterName: client.characterName,
      // Без чек-ина сегодня — всегда спокойный: отсутствие активности не грустит
      mood: checkin?.mood ?? 'CALM',
      checkedInToday: Boolean(checkin),
      scales: computeScales(needs),
      assignments: assignments.map((a) => ({ id: a.id, practice: toPracticeDto(a.practice) })),
    };
  });

  app.post('/api/client/checkin', async (request): Promise<CheckinResponse> => {
    const client = await currentClient(prisma, request);
    const body = checkinBody.parse(request.body);
    const date = localDate(client.timezone);
    const data = { mood: body.mood, lowNeed: body.lowNeed ?? null, isHardDay: body.isHardDay };
    // Повторный чек-ин в тот же день обновляет запись
    await prisma.checkin.upsert({
      where: { clientId_date: { clientId: client.id, date } },
      create: { clientId: client.id, date, ...data },
      update: data,
    });

    const [practices, assignments] = await Promise.all([
      prisma.practice.findMany({ where: { isActive: true } }),
      prisma.assignment.findMany({
        where: activeAssignmentsWhere(client.id),
        include: { practice: true },
      }),
    ]);
    const suggested = suggestPractice(
      { mood: body.mood, lowNeed: body.lowNeed ?? null, isHardDay: body.isHardDay },
      practices,
      assignments.map((a) => a.practice),
      deps.rng,
    );
    return { suggestedPractice: suggested ? toPracticeDto(suggested) : null };
  });

  app.post('/api/client/completions', async (request): Promise<CompletionResponse> => {
    const client = await currentClient(prisma, request);
    const body = completionBody.parse(request.body);
    const practice = await prisma.practice.findUnique({ where: { id: body.practiceId } });
    if (!practice || !practice.isActive) throw new HttpError(404, 'practice_not_found');

    const before = computeScales(await recentNeeds(prisma, client.id))[practice.need];
    const note = body.note || undefined;
    const completion = await prisma.completion.create({
      data: {
        clientId: client.id,
        practiceId: practice.id,
        noteEnc: note ? encryptNote(note, notesKey) : null,
        shareNote: Boolean(note) && body.shareNote,
      },
    });
    const after = computeScales(await recentNeeds(prisma, client.id))[practice.need];
    const showCrisis = deps.afterCompletion ? await deps.afterCompletion(client, note) : false;
    return {
      id: completion.id,
      need: practice.need,
      scaleBefore: before,
      scaleAfter: after,
      showCrisis,
    };
  });

  app.get('/api/client/history', async (request): Promise<HistoryDay[]> => {
    const client = await currentClient(prisma, request);
    const rows = await prisma.completion.findMany({
      where: { clientId: client.id },
      include: { practice: true },
      orderBy: { completedAt: 'desc' },
      take: 500,
    });
    // Только дни с практиками — без пустых «дыр» и пометок о пропусках
    const days = new Map<string, HistoryDay>();
    for (const r of rows) {
      const date = localDateString(client.timezone, r.completedAt);
      if (!days.has(date)) days.set(date, { date, items: [] });
      days.get(date)!.items.push({
        id: r.id,
        practiceId: r.practiceId,
        title: r.practice.title,
        need: r.practice.need,
        completedAt: r.completedAt.toISOString(),
        note: r.noteEnc ? decryptNote(r.noteEnc, notesKey) : null,
        shareNote: r.shareNote,
      });
    }
    return [...days.values()];
  });

  app.get('/api/client/settings', async (request): Promise<ClientSettings> => {
    const c = await currentClient(prisma, request);
    return { characterName: c.characterName, reminderHour: c.reminderHour, timezone: c.timezone };
  });

  app.patch('/api/client/settings', async (request): Promise<ClientSettings> => {
    const client = await currentClient(prisma, request);
    const body = settingsBody.parse(request.body);
    const c = await prisma.client.update({ where: { id: client.id }, data: body });
    return { characterName: c.characterName, reminderHour: c.reminderHour, timezone: c.timezone };
  });

  app.delete('/api/client/data', async (request) => {
    const client = await currentClient(prisma, request);
    const where = { clientId: client.id };
    // Удаляем всё о клиенте, включая сам профиль; следующий вход — как новый пользователь
    await prisma.$transaction([
      prisma.checkin.deleteMany({ where }),
      prisma.completion.deleteMany({ where }),
      prisma.assignment.deleteMany({ where }),
      prisma.consent.deleteMany({ where }),
      prisma.crisisEvent.deleteMany({ where }),
      prisma.client.delete({ where: { id: client.id } }),
      prisma.user.delete({ where: { id: request.user.id } }),
    ]);
    return { ok: true };
  });
}
