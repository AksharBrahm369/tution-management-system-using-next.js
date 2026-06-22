const { PrismaClient } = require("@prisma/client");

// We need to bypass the interactive institute scoping for this diagnostic run
process.env.BETTER_AUTH_SECRET = "fallback-secret-for-dev-only-replace-in-production";

const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Checking DB connection and statistics...");
    const standards = await prisma.standard.findMany({
      include: {
        _count: {
          select: {
            students: true,
            batches: true,
          }
        }
      }
    });

    console.log("Standards in DB:");
    for (const std of standards) {
      console.log(`- Standard ID: ${std.id}, Name: ${std.name}, Order: ${std.order}, Students Count: ${std._count.students}, Batches Count: ${std._count.batches}`);
    }

    const students = await prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        standardId: true,
        batchEnrollments: {
          select: {
            batchId: true,
            isActive: true,
          }
        }
      }
    });
    console.log(`\nTotal Students in DB: ${students.length}`);
    for (const s of students) {
      console.log(`- Student: ${s.firstName} ${s.lastName}, standardId: ${s.standardId}, batchEnrollments: ${JSON.stringify(s.batchEnrollments)}`);
    }

    const batches = await prisma.batch.findMany({
      select: {
        id: true,
        name: true,
        standardId: true,
      }
    });
    console.log(`\nTotal Batches in DB: ${batches.length}`);
    for (const b of batches) {
      console.log(`- Batch: ${b.name}, standardId: ${b.standardId}`);
    }

  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
