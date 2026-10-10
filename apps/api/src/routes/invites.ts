import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import {
  acceptInviteResponse,
  createInviteBody,
  registerPsychologistBody,
  type CreateInviteResponse,
} from '@psydog/shared';
import { currentPsychologist, requireNoRole } from '../auth/guards.js';
import { HttpError } from '../errors.js';

export const INVITE_TTL_DAYS = 14;

/** 10 символов из base64url — подходит для startapp (A-Z a-z 0-9 _ -). */
export function generateInviteCode(): string {
  return randomBytes(8).toString('base64url').slice(0, 10);
}

export function inviteLink(botUsername: string, code: string): string {
  return `https://t.me/${botUsername}/app?startapp=inv_${code}`;
}

export function registerInviteRoutes(
  app: FastifyInstance,
  deps: { prisma: PrismaClient; botUsername: string },
) {
  const { prisma } = deps;

  app.post('/api/psychologist/register', async (request) => {
    requireNoRole(request);
    const body = registerPsychologistBody.parse(request.body);
    await prisma.$transaction([
      prisma.user.update({ where: { id: request.user.id }, data: { role: 'PSYCHOLOGIST' } }),
      prisma.psychologist.create({
        data: { userId: request.user.id, displayName: body.displayName },
      }),
    ]);
    return { ok: true };
  });

  app.post('/api/invites', async (request): Promise<CreateInviteResponse> => {
    const psychologist = await currentPsychologist(prisma, request);
    const body = createInviteBody.parse(request.body);
    const invite = await prisma.invite.create({
      data: {
        code: generateInviteCode(),
        psychologistId: psychologist.id,
        alias: body.alias,
        expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return { code: invite.code, link: inviteLink(deps.botUsername, invite.code) };
  });

  app.post<{ Params: { code: string } }>('/api/invites/:code/accept', async (request) => {
    requireNoRole(request);
    const invite = await prisma.invite.findUnique({ where: { code: request.params.code } });
    if (!invite) throw new HttpError(404, 'invite_not_found');
    if (invite.usedAt) throw new HttpError(409, 'invite_used');
    if (invite.expiresAt < new Date()) throw new HttpError(410, 'invite_expired');

    await prisma.$transaction(async (tx) => {
      // Условное обновление — два одновременных принятия не пройдут оба
      const claimed = await tx.invite.updateMany({
        where: { id: invite.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count === 0) throw new HttpError(409, 'invite_used');
      await tx.user.update({ where: { id: request.user.id }, data: { role: 'CLIENT' } });
      await tx.client.create({
        data: {
          userId: request.user.id,
          psychologistId: invite.psychologistId,
          alias: invite.alias,
        },
      });
    });

    const psychologist = await prisma.psychologist.findUniqueOrThrow({
      where: { id: invite.psychologistId },
    });
    return acceptInviteResponse.parse({ psychologistName: psychologist.displayName });
  });

  // Превью приглашения до принятия: кто приглашает
  app.get<{ Params: { code: string } }>('/api/invites/:code', async (request) => {
    const invite = await prisma.invite.findUnique({
      where: { code: request.params.code },
      include: { psychologist: true },
    });
    if (!invite) throw new HttpError(404, 'invite_not_found');
    return {
      psychologistName: invite.psychologist.displayName,
      status: invite.usedAt ? 'used' : invite.expiresAt < new Date() ? 'expired' : 'active',
    };
  });
}
