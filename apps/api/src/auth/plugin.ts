import type { FastifyInstance } from 'fastify';
import type { PrismaClient, User } from '@prisma/client';
import { AuthError, identityFromHeaders, type TelegramIdentity } from './initData.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: User;
    tg: TelegramIdentity;
  }
}

const PUBLIC_ROUTES = new Set(['/api/health']);

export function registerAuth(
  app: FastifyInstance,
  deps: { prisma: PrismaClient; botToken: string; isDev: boolean },
) {
  app.decorateRequest('user', null as unknown as User);
  app.decorateRequest('tg', null as unknown as TelegramIdentity);

  app.addHook('onRequest', async (request, reply) => {
    const path = request.routeOptions.url;
    if (!path?.startsWith('/api/') || PUBLIC_ROUTES.has(path)) return;

    let identity: TelegramIdentity;
    try {
      identity = identityFromHeaders(request.headers, deps);
    } catch (err) {
      if (err instanceof AuthError) {
        request.log.info({ reason: err.message }, 'auth rejected');
        return reply.code(401).send({ error: 'unauthorized' });
      }
      throw err;
    }

    request.tg = identity;
    request.user = await deps.prisma.user.upsert({
      where: { tgId: identity.tgId },
      create: { tgId: identity.tgId, firstName: identity.firstName },
      // firstName обновляем, только если пришёл из initData (dev-заголовок его не несёт)
      update: identity.firstName ? { firstName: identity.firstName } : {},
    });
  });
}
