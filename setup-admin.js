const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const institute = await prisma.institute.upsert({
    where: { id: "darshan-default-institute" },
    update: {
      name: "Darshan Tuition",
      slug: "darshan-tuition",
    },
    create: {
      id: "darshan-default-institute",
      name: "Darshan Tuition",
      slug: "darshan-tuition",
    },
  });

  const hashedPassword = await bcrypt.hash("Darshan@369", 12);
  const user = await prisma.user.upsert({
    where: { email: "darshanzala369@gmail.com" },
    update: {
      instituteId: institute.id,
      name: "Darshan Zala",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      isVerified: true,
    },
    create: {
      instituteId: institute.id,
      name: "Darshan Zala",
      email: "darshanzala369@gmail.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
      isVerified: true,
    },
  });

  await prisma.institute.update({
    where: { id: institute.id },
    data: { ownerId: user.id },
  });

  console.log("Super admin ready:", user.email, "Institute:", institute.name);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
