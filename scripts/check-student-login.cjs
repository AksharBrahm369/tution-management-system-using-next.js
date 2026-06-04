const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudent() {
  const studentCode = 'STU-2026-056';
  const student = await prisma.student.findUnique({
    where: { studentCode },
    include: { user: true }
  });
  console.log('Student found:', !!student);
  if (student) {
    console.log('Has User:', !!student.user);
    if (student.user) {
      console.log('User Role:', student.user.role);
      console.log('User IsActive:', student.user.isActive);
    }
  }
}

checkStudent().catch(console.error).finally(() => prisma.$disconnect());
