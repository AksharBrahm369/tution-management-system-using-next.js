import { prisma } from "@/lib/prisma";

async function main() {
  const admins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true, email: true, name: true, isActive: true } });
  console.log(JSON.stringify(admins, null, 2));
  await prisma.$disconnect();
}

main();
