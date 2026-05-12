/**
 * TuitionPro - Prisma Client Singleton
 *
 * Prevents multiple Prisma Client instances in development (due to hot-reload).
 * In production, a single instance is always created.
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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Persist client across hot reloads in development only
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
