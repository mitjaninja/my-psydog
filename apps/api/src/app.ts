import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { HealthResponse } from '@psydog/shared';
import type { Config } from './config.js';
import { registerAuth } from './auth/plugin.js';
import { registerMeRoutes } from './routes/me.js';

export function buildApp(deps: { config: Config; prisma: PrismaClient }) {
  const app = Fastify({ logger: true });

  registerAuth(app, {
    prisma: deps.prisma,
    botToken: deps.config.botToken,
    isDev: deps.config.isDev,
  });

  app.get('/api/health', async (): Promise<HealthResponse> => ({ ok: true }));
  registerMeRoutes(app);

  return app;
}
