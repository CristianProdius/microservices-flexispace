import { PrismaClient } from "../generated/prisma";

// Use globalThis (cross-runtime) rather than `global` (Node-only). The cast
// is narrowed so TypeScript reflects the possibility that no instance exists
// yet — the previous `as { prisma: PrismaClient }` claimed the field was
// always present, which masked the `||` fallback in the next line.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
