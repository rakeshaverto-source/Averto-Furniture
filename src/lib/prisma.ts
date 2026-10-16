// One Prisma client for the whole server. In dev, Next.js hot-reloads modules, so the client is
// parked on globalThis — otherwise every reload would open a fresh pool of database connections.
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaClass?: typeof PrismaClient };

function createClient() {
  // DATABASE_URL is Supabase's transaction-mode pooler, which suits short serverless requests.
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// After `prisma migrate` / `prisma generate` the generated client is a new class. A client parked
// from before would not know the new columns, so it is replaced instead of reused.
if (globalForPrisma.prisma && globalForPrisma.prismaClass !== PrismaClient) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClass = PrismaClient;
}
