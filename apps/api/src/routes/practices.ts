import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { NEED_IDS, type Need, type PracticeDto } from '@psydog/shared';
import { toPracticeDto } from '../client/practices.js';
import { HttpError } from '../errors.js';

export function registerPracticeRoutes(app: FastifyInstance, deps: { prisma: PrismaClient }) {
  const { prisma } = deps;

  // Библиотека практик: для «Выбрать другую» у клиента и для назначения у психолога
  app.get<{ Querystring: { need?: string; comforting?: string } }>(
    '/api/practices',
    async (request): Promise<PracticeDto[]> => {
      const { need, comforting } = request.query;
      if (need && !NEED_IDS.includes(need as Need)) throw new HttpError(400, 'invalid_need');
      const list = await prisma.practice.findMany({
        where: {
          isActive: true,
          ...(need ? { need: need as Need } : {}),
          ...(comforting === '1' ? { isComforting: true } : {}),
        },
        orderBy: [{ need: 'asc' }, { title: 'asc' }],
      });
      return list.map(toPracticeDto);
    },
  );

  app.get<{ Params: { id: string } }>('/api/practices/:id', async (request) => {
    const p = await prisma.practice.findUnique({ where: { id: request.params.id } });
    if (!p || !p.isActive) throw new HttpError(404, 'practice_not_found');
    return toPracticeDto(p);
  });
}
