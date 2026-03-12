import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// In production: DATABASE_URL points to the volume-mounted db (e.g. file:/app/data/dev.db)
// In development: falls back to dev.db at project root
const dbUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), 'dev.db')}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: dbUrl }),
  } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
