import { prisma } from "@/lib/prisma";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: tsx scripts/findExam.ts <examId>");
    process.exit(2);
  }

  try {
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      console.log(`Exam not found for id=${id}`);
      process.exit(0);
    }
    console.log(JSON.stringify(exam, null, 2));
  } catch (err) {
    console.error("Error querying exam:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
