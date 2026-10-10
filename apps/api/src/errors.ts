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
    // Ошибки самого Fastify (пустое JSON-тело, битый JSON и т. п.) несут свой 4xx
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status >= 400 && status < 500) {
      return reply.code(status).send({ error: (err as { code?: string }).code ?? 'bad_request' });
    }
    request.log.error(err);
    return reply.code(500).send({ error: 'internal' });
  });
}
