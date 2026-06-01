import "dotenv/config";
import { prisma } from "../lib/prisma";
import { seedActivityLogs } from "../prisma/seedActivityLogs";

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (!admin) {
    console.error("No super admin found");
    process.exit(1);
  }
  await seedActivityLogs(prisma, { id: admin.id, name: admin.name, role: admin.role }, []);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
