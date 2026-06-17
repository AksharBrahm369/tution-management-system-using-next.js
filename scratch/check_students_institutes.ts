import "dotenv/config";
import { prisma } from "../lib/prisma";
import { withoutAuthScope } from "../lib/institute";

async function main() {
  await withoutAuthScope(async () => {
    const student = await prisma.student.findUnique({
      where: { id: "cmqg90r7k001fiwubwp8ajuap" },
      include: {
        examResults: {
          include: {
            exam: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });
    console.log("Student exam results:", JSON.stringify(student?.examResults, null, 2));
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
