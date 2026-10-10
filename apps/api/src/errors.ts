import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, request, reply) => {
    if (err instanceof HttpError) return reply.code(err.status).send({ error: err.code });
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: 'invalid_body', issues: err.issues });
    }
    request.log.error(err);
    return reply.code(500).send({ error: 'internal' });
  });
}
