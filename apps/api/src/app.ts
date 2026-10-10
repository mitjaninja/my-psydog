import Fastify from 'fastify';
import type { HealthResponse } from '@psydog/shared';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.get('/api/health', async (): Promise<HealthResponse> => ({ ok: true }));

  return app;
}
