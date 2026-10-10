import type { FastifyRequest } from 'fastify';
import type { Client, Psychologist, PrismaClient, Role } from '@prisma/client';
import { HttpError } from '../errors.js';

export function requireNoRole(request: FastifyRequest) {
  if (request.user.role) throw new HttpError(409, 'role_already_set');
}

export function requireRole(request: FastifyRequest, role: Role) {
  if (request.user.role !== role) throw new HttpError(403, 'forbidden');
}

export async function currentPsychologist(
  prisma: PrismaClient,
  request: FastifyRequest,
): Promise<Psychologist> {
  requireRole(request, 'PSYCHOLOGIST');
  const p = await prisma.psychologist.findUnique({ where: { userId: request.user.id } });
  if (!p) throw new HttpError(403, 'forbidden');
  return p;
}

export async function currentClient(
  prisma: PrismaClient,
  request: FastifyRequest,
): Promise<Client> {
  requireRole(request, 'CLIENT');
  const c = await prisma.client.findUnique({ where: { userId: request.user.id } });
  if (!c) throw new HttpError(403, 'forbidden');
  return c;
}
