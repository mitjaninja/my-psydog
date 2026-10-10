import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { currentClient } from '../auth/guards.js';
import type { Notifier } from '../notifier.js';
import { recordCrisis } from '../crisis/service.js';

export function registerCrisisRoutes(
  app: FastifyInstance,
  deps: { prisma: PrismaClient; notifier: Notifier },
) {
  // Нажатие «Мне очень плохо»
  app.post('/api/client/crisis', async (request) => {
    const client = await currentClient(deps.prisma, request);
    await recordCrisis(deps, client, 'button');
    return { ok: true };
  });
}
