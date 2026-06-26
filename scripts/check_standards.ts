import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } }) : new Pool();
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const INSTITUTE_ID = "cmqunr0lt000104jv3vprrtgn";

async function main() {
  const standards = await prisma.standard.findMany({
    where: { instituteId: INSTITUTE_ID }
  });
  console.log("Standards in DB for institute:", standards);
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
