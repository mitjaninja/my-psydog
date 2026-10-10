import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { HealthResponse } from '@psydog/shared';
import type { Config } from './config.js';
import { registerAuth } from './auth/plugin.js';
import { registerErrorHandler } from './errors.js';
import { registerMeRoutes } from './routes/me.js';
import { registerInviteRoutes } from './routes/invites.js';

export function buildApp(deps: { config: Config; prisma: PrismaClient; logger?: boolean }) {
  const app = Fastify({ logger: deps.logger ?? true });
  const { prisma, config } = deps;

  registerErrorHandler(app);
  registerAuth(app, { prisma, botToken: config.botToken, isDev: config.isDev });

  app.get('/api/health', async (): Promise<HealthResponse> => ({ ok: true }));
  registerMeRoutes(app, { prisma });
  registerInviteRoutes(app, { prisma, botUsername: config.botUsername });

  return app;
}
