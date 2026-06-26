import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } }) : new Pool();
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const SOURCE_INSTITUTE_ID = "seed-default-institute";

async function main() {
  console.log(`🧹 Cleaning up deprecated institute: ${SOURCE_INSTITUTE_ID}...`);

  const models = [
    "batchEnrollment",
    "student",
    "parent",
    "batch",
    "teacherSubject",
    "teacher",
    "subject",
    "standard",
  ];

  for (const modelName of models) {
    const delegate = (prisma as any)[modelName];
    if (delegate && delegate.deleteMany) {
      const result = await delegate.deleteMany({
        where: { instituteId: SOURCE_INSTITUTE_ID }
      });
      console.log(`Deleted from ${modelName}:`, result);
    }
  }

  // Delete institute itself
  await prisma.institute.deleteMany({
    where: { id: SOURCE_INSTITUTE_ID }
  });
  console.log("Deleted institute record.");
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
