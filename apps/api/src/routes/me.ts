import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { MeResponse } from '@psydog/shared';

export function registerMeRoutes(app: FastifyInstance, deps: { prisma: PrismaClient }) {
  app.get('/api/me', async (request): Promise<MeResponse> => {
    const { user, tg } = request;
    const [psychologist, client] = await Promise.all([
      user.role === 'PSYCHOLOGIST'
        ? deps.prisma.psychologist.findUnique({ where: { userId: user.id } })
        : null,
      user.role === 'CLIENT' ? deps.prisma.client.findUnique({ where: { userId: user.id } }) : null,
    ]);
    return {
      id: user.id,
      // BigInt не сериализуется в JSON — отдаём строкой
      tgId: user.tgId.toString(),
      firstName: user.firstName,
      role: user.role,
      startParam: tg.startParam,
      psychologist: psychologist ? { displayName: psychologist.displayName } : null,
      client: client ? { onboardedAt: client.onboardedAt?.toISOString() ?? null } : null,
    };
  });
}
