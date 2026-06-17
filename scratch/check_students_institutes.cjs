const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const institutesCount = await prisma.institute.count();
  const institutes = await prisma.institute.findMany();
  const studentsCount = await prisma.student.count();
  const students = await prisma.student.findMany({
    take: 5,
    select: { id: true, firstName: true, lastName: true, studentCode: true }
  });
  console.log({ institutesCount, institutes, studentsCount, students });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
