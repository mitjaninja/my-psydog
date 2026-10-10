import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { HealthResponse } from '@psydog/shared';
import type { Config } from './config.js';
import { registerAuth } from './auth/plugin.js';
import { registerErrorHandler } from './errors.js';
import { registerMeRoutes } from './routes/me.js';
import { registerInviteRoutes } from './routes/invites.js';
import { registerOnboardingRoutes } from './routes/onboarding.js';
import { registerPracticeRoutes } from './routes/practices.js';
import { registerClientRoutes, type ClientRouteDeps } from './routes/client.js';
import { registerCrisisRoutes } from './routes/crisis.js';
import { registerPsychologistRoutes } from './routes/psychologist.js';
import { hasCrisisKeywords } from './crisis/keywords.js';
import { recordCrisis } from './crisis/service.js';
import type { Notifier } from './notifier.js';

export function buildApp(deps: {
  config: Config;
  prisma: PrismaClient;
  logger?: boolean;
  rng?: ClientRouteDeps['rng'];
  notifier: Notifier;
}) {
  const app = Fastify({ logger: deps.logger ?? true });
  const { prisma, config, notifier } = deps;

  registerErrorHandler(app);
  registerAuth(app, { prisma, botToken: config.botToken, isDev: config.isDev });

  app.get('/api/health', async (): Promise<HealthResponse> => ({ ok: true }));
  registerMeRoutes(app, { prisma });
  registerInviteRoutes(app, { prisma, botUsername: config.botUsername });
  registerOnboardingRoutes(app, { prisma });
  registerPracticeRoutes(app, { prisma });
  registerClientRoutes(app, {
    prisma,
    notesKey: config.notesKey,
    rng: deps.rng,
    // Ключевые слова в заметке → CrisisEvent(keyword) и кризисный экран у клиента
    afterCompletion: async (client, note) => {
      if (!hasCrisisKeywords(note)) return false;
      await recordCrisis({ prisma, notifier }, client, 'keyword');
      return true;
    },
  });
  registerCrisisRoutes(app, { prisma, notifier });
  registerPsychologistRoutes(app, { prisma, notesKey: config.notesKey });

  return app;
}
