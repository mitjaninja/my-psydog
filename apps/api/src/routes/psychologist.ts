import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Client, PrismaClient } from '@prisma/client';
import {
  assignBody,
  NEED_IDS,
  SUMMARY_PERIODS,
  type Need,
  type NeedScales,
  type PsyClientListItem,
  type PsyClientSummary,
  type SummaryPeriod,
} from '@psydog/shared';
import { currentPsychologist } from '../auth/guards.js';
import { HttpError } from '../errors.js';
import { DAY_MS, localDateString } from '../lib/dates.js';
import { decryptNote } from '../lib/notes.js';
import { computeScales, SCALE_WINDOW_DAYS } from '../client/scales.js';
import { toPracticeDto } from '../client/practices.js';
import { activeAssignmentsWhere } from './client.js';

export function registerPsychologistRoutes(
  app: FastifyInstance,
  deps: { prisma: PrismaClient; notesKey: Buffer },
) {
  const { prisma, notesKey } = deps;

  /** Клиент этого психолога — иначе 404 (не раскрываем, что такой клиент есть). */
  async function ownClient(request: FastifyRequest, clientId: string): Promise<Client> {
    const psychologist = await currentPsychologist(prisma, request);
    const client = await prisma.client.findFirst({
      where: { id: clientId, psychologistId: psychologist.id },
    });
    if (!client) throw new HttpError(404, 'client_not_found');
    return client;
  }

  app.get('/api/p/clients', async (request): Promise<PsyClientListItem[]> => {
    const psychologist = await currentPsychologist(prisma, request);
    const clients = await prisma.client.findMany({
      where: { psychologistId: psychologist.id },
      include: {
        checkins: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        completions: { select: { completedAt: true }, orderBy: { completedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    return clients.map((c) => {
      const times = [c.checkins[0]?.createdAt, c.completions[0]?.completedAt].filter(
        (d): d is Date => Boolean(d),
      );
      const last = times.sort((a, b) => b.getTime() - a.getTime())[0];
      return { id: c.id, alias: c.alias, lastActivityAt: last?.toISOString() ?? null };
    });
  });

  app.get<{ Params: { id: string }; Querystring: { days?: string } }>(
    '/api/p/clients/:id/summary',
    async (request): Promise<PsyClientSummary> => {
      const client = await ownClient(request, request.params.id);
      const days = Number(request.query.days ?? 7) as SummaryPeriod;
      if (!SUMMARY_PERIODS.includes(days)) throw new HttpError(400, 'invalid_days');

      const now = Date.now();
      const since = new Date(now - days * DAY_MS);
      const scaleSince = new Date(now - SCALE_WINDOW_DAYS * DAY_MS);
      const sinceDate = new Date(`${localDateString(client.timezone, since)}T00:00:00.000Z`);

      const [completions, checkins, assignments] = await Promise.all([
        prisma.completion.findMany({
          where: {
            clientId: client.id,
            completedAt: { gt: since < scaleSince ? since : scaleSince },
          },
          include: { practice: true },
          orderBy: { completedAt: 'desc' },
        }),
        prisma.checkin.findMany({
          where: { clientId: client.id, date: { gte: sinceDate } },
          orderBy: { date: 'desc' },
        }),
        prisma.assignment.findMany({
          where: activeAssignmentsWhere(client.id),
          include: { practice: true },
          orderBy: { activeFrom: 'desc' },
        }),
      ]);

      const inPeriod = completions.filter((c) => c.completedAt > since);
      const byNeed = Object.fromEntries(NEED_IDS.map((n) => [n, 0])) as NeedScales;
      for (const c of inPeriod) byNeed[c.practice.need as Need] += 1;

      return {
        client: {
          id: client.id,
          alias: client.alias,
          characterName: client.characterName,
          onboarded: Boolean(client.onboardedAt),
        },
        days,
        scales: computeScales(
          completions.filter((c) => c.completedAt > scaleSince).map((c) => c.practice.need as Need),
        ),
        completionsByNeed: byNeed,
        checkins: checkins.length,
        hardDays: checkins.filter((c) => c.isHardDay).map((c) => c.date.toISOString().slice(0, 10)),
        completions: inPeriod.map((c) => ({
          id: c.id,
          title: c.practice.title,
          need: c.practice.need as Need,
          completedAt: c.completedAt.toISOString(),
        })),
        // Заметки без shareNote не покидают сервер
        sharedNotes: inPeriod
          .filter((c) => c.shareNote && c.noteEnc)
          .map((c) => ({
            completionId: c.id,
            title: c.practice.title,
            completedAt: c.completedAt.toISOString(),
            note: decryptNote(c.noteEnc!, notesKey),
          })),
        assignments: assignments.map((a) => ({
          id: a.id,
          practice: toPracticeDto(a.practice),
          activeFrom: a.activeFrom.toISOString(),
        })),
      };
    },
  );

  app.post<{ Params: { id: string } }>('/api/p/clients/:id/assignments', async (request) => {
    const client = await ownClient(request, request.params.id);
    const { practiceIds } = assignBody.parse(request.body);
    const practices = await prisma.practice.findMany({
      where: { id: { in: practiceIds }, isActive: true },
    });
    if (practices.length !== new Set(practiceIds).size) {
      throw new HttpError(400, 'unknown_practice');
    }
    const active = await prisma.assignment.findMany({ where: activeAssignmentsWhere(client.id) });
    const already = new Set(active.map((a) => a.practiceId));
    const toCreate = practices.filter((p) => !already.has(p.id));
    await prisma.assignment.createMany({
      data: toCreate.map((p) => ({ clientId: client.id, practiceId: p.id })),
    });
    return { created: toCreate.length };
  });

  app.delete<{ Params: { id: string } }>('/api/p/assignments/:id', async (request) => {
    const psychologist = await currentPsychologist(prisma, request);
    const assignment = await prisma.assignment.findFirst({
      where: { id: request.params.id, client: { psychologistId: psychologist.id } },
    });
    if (!assignment) throw new HttpError(404, 'assignment_not_found');
    // Мягко снимаем: история назначений остаётся
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { activeTo: new Date() },
    });
    return { ok: true };
  });
}
