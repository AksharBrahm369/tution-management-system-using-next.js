import { prisma } from "@/lib/prisma";
import { withoutAuthScope } from "@/lib/institute";

const DEFAULT_INSTITUTE_ID = "legacy-default-institute";

const INSTITUTE_BACKFILL_MODELS = [
  "user",
  "session",
  "oTPVerification",
  "activityLog",
  "passwordResetToken",
  "notification",
  "enquiry",
  "followUp",
  "demoClass",
  "dashboardAlert",
  "instituteSettings",
  "academicYear",
  "backupRecord",
  "student",
  "standard",
  "parent",
  "emergencyContact",
  "medicalInfo",
  "studentDocument",
  "siblingLink",
  "attendance",
  "attendanceSession",
  "attendanceAlert",
  "attendanceNotification",
  "feeStructure",
  "feeRecord",
  "feePayment",
  "discount",
  "scholarship",
  "feeReminder",
  "refund",
  "onlinePaymentOrder",
  "announcement",
  "report",
  "reportRun",
  "analyticsSnapshot",
  "studentProgressReport",
  "pTMMeeting",
  "pTMSlot",
  "parentFeedback",
  "teacherPerformanceReport",
  "exam",
  "examResult",
  "examQuestion",
  "studentAnswer",
  "onlineAttempt",
  "gradeConfig",
  "gradeRange",
  "reportCard",
  "performanceAnalysis",
  "studentActivity",
  "teacher",
  "subject",
  "studyMaterial",
  "teacherSubject",
  "teacherStandardSubject",
  "teacherAttendance",
  "teacherLeave",
  "salaryRecord",
  "teacherDocument",
  "teacherPerformance",
  "room",
  "batch",
  "batchEnrollment",
  "timetableSlot",
  "classSession",
  "holiday",
  "academicCalendar",
  "conflictLog",
  "classSchedule",
] as const;

async function main() {
  console.log("🚀 Starting SaaS Multi-Tenant Data Migration...");

  await withoutAuthScope(async () => {
    try {
      // 1. Create or verify the default institute
      console.log("🏢 Creating or verifying the default institute...");
      const institute = await prisma.institute.upsert({
        where: { id: DEFAULT_INSTITUTE_ID },
        update: {},
        create: {
          id: DEFAULT_INSTITUTE_ID,
          name: "Default Institute",
          slug: "default-institute",
        },
      });
      console.log(`✅ Default Institute: "${institute.name}" (ID: ${institute.id})`);

      // 2. Link first SUPER_ADMIN user as owner if ownerId is not set
      const firstAdmin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        orderBy: { createdAt: "asc" },
      });

      if (firstAdmin) {
        console.log(`👤 Found first SUPER_ADMIN: "${firstAdmin.name}" (${firstAdmin.email})`);
        if (!institute.ownerId) {
          await prisma.institute.update({
            where: { id: institute.id },
            data: { ownerId: firstAdmin.id },
          });
          console.log(`🔗 Linked SUPER_ADMIN "${firstAdmin.email}" as the institute owner.`);
        }
      } else {
        console.log("⚠️ No SUPER_ADMIN found to set as institute owner.");
      }

      // 3. Backfill all tables
      console.log("📦 Backfilling records without instituteId...");
      for (const modelName of INSTITUTE_BACKFILL_MODELS) {
        const delegate = (prisma as any)[modelName];
        if (!delegate || typeof delegate.updateMany !== "function") {
          console.log(`⚠️ Skip model "${modelName}": updateMany delegate not found`);
          continue;
        }

        try {
          const result = await delegate.updateMany({
            where: { instituteId: null },
            data: { instituteId: institute.id },
          });
          if (result.count > 0) {
            console.log(`✅ Model "${modelName}": Migrated ${result.count} records.`);
          }
        } catch (err: any) {
          console.error(`❌ Failed to migrate model "${modelName}":`, err.message);
        }
      }

      console.log("🎉 Migration completed successfully!");
    } catch (err: any) {
      console.error("❌ Migration error:", err.message);
    }
  });

  await prisma.$disconnect();
}

main();
