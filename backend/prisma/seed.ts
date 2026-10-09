import path from 'node:path';
import { config } from 'dotenv';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role, UserStatus } from '../src/generated/prisma/client.js';

config({ path: path.resolve(process.cwd(), '..', '.env'), quiet: true });

const DEV_PASSWORD = 'Admin123!';
const USER_COUNT = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

const FIRST_NAMES = [
  'Ana', 'Luis', 'Maria', 'Carlos', 'Sofia', 'Jorge', 'Lucia', 'Pedro', 'Elena', 'Diego',
  'Valeria', 'Andres', 'Camila', 'Mateo', 'Isabel',
];
const LAST_NAMES = ['Garcia', 'Lopez', 'Martinez', 'Rodriguez', 'Perez', 'Gomez', 'Diaz', 'Torres'];

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // Hash once and reuse: argon2 is deliberately slow and every seeded user shares the dev password.
    const passwordHash = await argon2.hash(DEV_PASSWORD, { type: argon2.argon2id });
    const now = Date.now();

    const seedUsers = [
      {
        email: 'admin@devpanel.local',
        name: 'Admin DevPanel',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        createdAt: new Date(now - 90 * DAY_MS),
        lastLoginAt: new Date(now - DAY_MS),
      },
      {
        email: 'editor@devpanel.local',
        name: 'Editor DevPanel',
        role: Role.EDITOR,
        status: UserStatus.ACTIVE,
        createdAt: new Date(now - 60 * DAY_MS),
        lastLoginAt: new Date(now - 2 * DAY_MS),
      },
      {
        email: 'viewer@devpanel.local',
        name: 'Viewer DevPanel',
        role: Role.VIEWER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(now - 45 * DAY_MS),
        lastLoginAt: new Date(now - 3 * DAY_MS),
      },
      ...Array.from({ length: USER_COUNT - 3 }, (_, i) => {
        const first = pick(FIRST_NAMES, i);
        const last = pick(LAST_NAMES, i * 3 + 1);
        return {
          email: `${first}.${last}${i + 1}@devpanel.local`.toLowerCase(),
          name: `${first} ${last}`,
          role: pick([Role.VIEWER, Role.VIEWER, Role.EDITOR, Role.ADMIN], i),
          status: pick(
            [UserStatus.ACTIVE, UserStatus.ACTIVE, UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED],
            i,
          ),
          // Spread over the last 90 days so "new in the last 30 days" is a meaningful metric.
          createdAt: new Date(now - ((i * 37) % 90) * DAY_MS),
          // Every third user has never logged in.
          lastLoginAt: i % 3 === 0 ? null : new Date(now - ((i * 11) % 30) * DAY_MS),
        };
      }),
    ];

    for (const user of seedUsers) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: { ...user, passwordHash },
      });
    }

    console.log(`Seed complete: ${await prisma.user.count()} users (admin: admin@devpanel.local / ${DEV_PASSWORD})`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
