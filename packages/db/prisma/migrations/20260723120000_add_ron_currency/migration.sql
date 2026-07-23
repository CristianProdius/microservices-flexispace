-- Add RON (Romanian leu) to the Currency enum.
-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so Prisma
-- applies this migration as a single non-transactional statement.
ALTER TYPE "Currency" ADD VALUE IF NOT EXISTS 'RON';
