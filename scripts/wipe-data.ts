import { prisma } from "../lib/prisma";

async function wipeData() {
  console.log("Starting full database wipe...");

  try {
    // Delete all transactional and operational data first to avoid FK constraints
    console.log("Deleting communications & logs...");
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.announcement.deleteMany();
    
    console.log("Deleting enquiries & admissions...");
    await prisma.followUp.deleteMany();
    await prisma.demoClass.deleteMany();
    await prisma.enquiry.deleteMany();

    console.log("Deleting attendance data...");
    await prisma.attendanceNotification.deleteMany();
    await prisma.attendanceAlert.deleteMany();
    await prisma.attendanceSession.deleteMany();
    await prisma.attendance.deleteMany();

    console.log("Deleting fee data...");
    await prisma.feePayment.deleteMany();
    await prisma.feeReminder.deleteMany();
    await prisma.feeRecord.deleteMany();
    await prisma.feeStructure.deleteMany();

    console.log("Deleting exam data...");
    await prisma.onlineAttempt.deleteMany();
    await prisma.studentAnswer.deleteMany();
    await prisma.examQuestion.deleteMany();
    await prisma.examResult.deleteMany();
    await prisma.exam.deleteMany();

    console.log("Deleting academic data...");
    await prisma.classSession.deleteMany();
    await prisma.timetableSlot.deleteMany();
    await prisma.conflictLog.deleteMany();
    await prisma.classSchedule.deleteMany();

    console.log("Deleting enrollment data...");
    await prisma.batchEnrollment.deleteMany();
    
    console.log("Deleting core entities...");
    await prisma.studentDocument.deleteMany();
    await prisma.emergencyContact.deleteMany();
    await prisma.medicalInfo.deleteMany();
    await prisma.siblingLink.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.scholarship.deleteMany();
    
    await prisma.student.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.batch.deleteMany();
    
    await prisma.teacherPerformance.deleteMany();
    await prisma.teacherDocument.deleteMany();
    await prisma.salaryRecord.deleteMany();
    await prisma.teacherLeave.deleteMany();
    await prisma.teacherAttendance.deleteMany();
    await prisma.teacherSubject.deleteMany();
    await prisma.teacher.deleteMany();

    await prisma.subject.deleteMany();
    await prisma.room.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.academicCalendar.deleteMany();

    // Delete non-admin users
    console.log("Deleting non-admin users...");
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({
      where: { role: { not: "SUPER_ADMIN" } }
    });

    console.log("Database successfully wiped! Only the Admin user and basic configuration remain.");
  } catch (error) {
    console.error("Error wiping database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeData();
