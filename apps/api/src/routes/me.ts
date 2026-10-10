import type { FastifyInstance } from 'fastify';
import type { MeResponse } from '@psydog/shared';

export function registerMeRoutes(app: FastifyInstance) {
  app.get('/api/me', async (request): Promise<MeResponse> => {
    const { user, tg } = request;
    return {
      id: user.id,
      // BigInt не сериализуется в JSON — отдаём строкой
      tgId: user.tgId.toString(),
      firstName: user.firstName,
      role: user.role,
      startParam: tg.startParam,
    };
  });
}
