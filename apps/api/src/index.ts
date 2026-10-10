import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { prisma } from './db.js';

const config = loadConfig();
const app = buildApp({ config, prisma });

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app
      .close()
      .then(() => prisma.$disconnect())
      .then(() => process.exit(0));
  });
}
