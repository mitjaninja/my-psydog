import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { CONSENT_VERSION, onboardingBody, type ConsentType } from '@psydog/shared';
import { currentClient } from '../auth/guards.js';
import { HttpError } from '../errors.js';

export function registerOnboardingRoutes(app: FastifyInstance, deps: { prisma: PrismaClient }) {
  const { prisma } = deps;

  app.post('/api/client/onboarding', async (request) => {
    const client = await currentClient(prisma, request);
    if (client.onboardedAt) throw new HttpError(409, 'already_onboarded');
    const body = onboardingBody.parse(request.body);

    const types: ConsentType[] = ['data_processing', 'share_with_psychologist'];
    if (body.consents.crisisNotify) types.push('crisis_notify');

    await prisma.$transaction([
      prisma.consent.createMany({
        data: types.map((type) => ({ clientId: client.id, type, version: CONSENT_VERSION })),
      }),
      prisma.client.update({
        where: { id: client.id },
        data: {
          reminderHour: body.reminderHour,
          ...(body.timezone ? { timezone: body.timezone } : {}),
          onboardedAt: new Date(),
        },
      }),
    ]);
    return { ok: true };
  });
}
