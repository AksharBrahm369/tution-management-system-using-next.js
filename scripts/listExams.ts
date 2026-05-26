import { prisma } from "@/lib/prisma";

async function main() {
  try {
    const exams = await prisma.exam.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { id: true, title: true, code: true } });
    if (!exams.length) {
      console.log("No exams found in the database.");
      process.exit(0);
    }
    console.log(JSON.stringify(exams, null, 2));
  } catch (err) {
    console.error("Error listing exams:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
