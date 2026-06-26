import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } }) : new Pool();
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "darshanzala369@gmail.com" }
  });
  console.log("User details:", user);

  const sessions = await prisma.session.findMany({
    where: { userId: user?.id }
  });
  console.log("User active sessions:", sessions);

  const institutes = await prisma.institute.findMany();
  console.log("Institutes in DB:", institutes);

  const counts = {
    students: await prisma.student.count(),
    teachers: await prisma.teacher.count(),
    batches: await prisma.batch.count(),
    users: await prisma.user.count()
  };
  console.log("Record counts in database:", counts);
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
