/**
 * TuitionPro - Prisma Client
 *
 * In production we keep a singleton.
 * In development we prefer a fresh client so schema changes made during
 * active work are picked up immediately instead of reusing a stale delegate.
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Extend global type to hold the Prisma instance across hot reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize the database connection pool and Prisma adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes("[YOUR-PASSWORD]")) {
  console.warn(
    "⚠️ DATABASE_URL is not configured properly in .env! Please replace [YOUR-PASSWORD] with your actual password."
  );
}

// We only initialize the pool if it's a valid-looking URL to prevent ERR_INVALID_URL crashes
let pool;
try {
  pool = new Pool({ connectionString });
} catch (e) {
  // Fallback so the server doesn't crash on start, though queries will fail
  pool = new Pool();
}

const adapter = new PrismaPg(pool);

const isProduction = process.env.NODE_ENV === "production";
const cachedPrisma = globalForPrisma.prisma;

export const prisma =
  (isProduction ? cachedPrisma : undefined) ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Persist only in production. In development we want schema changes
// like new models/fields to be reflected without stale client reuse.
if (isProduction) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
