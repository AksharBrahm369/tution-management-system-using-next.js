import { prisma } from '../lib/prisma';

async function main() {
  const student = await prisma.student.findFirst({
    where: { studentCode: "STU-2026-056" },
    include: { user: true }
  });
  console.log("Student exists?", !!student);
  if (student) {
    console.log("Has User Account?", !!student.userId);
    console.log("User Data:", student.user ? {
      email: student.user.email,
      isActive: student.user.isActive
    } : null);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
