import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// The single .env lives at the repo root, while the Prisma CLI runs from backend/.
// `dotenv/config` would look for backend/.env, so the path is explicit.
// Variables already present in the environment (CI, Docker) take precedence.
config({ path: path.resolve(process.cwd(), '..', '.env'), quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
