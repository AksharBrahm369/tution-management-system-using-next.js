import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== "DELETE") {
      return NextResponse.json({ error: "Confirmation failed" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.attendanceNotification.deleteMany(),
      prisma.attendanceAlert.deleteMany(),
      prisma.attendanceSession.deleteMany(),
      prisma.attendance.deleteMany(),
      prisma.followUp.deleteMany(),
      prisma.demoClass.deleteMany(),
      prisma.enquiry.deleteMany(),
      prisma.studentActivity.deleteMany(),
      prisma.onlineAttempt.deleteMany(),
      prisma.studentAnswer.deleteMany(),
      prisma.examQuestion.deleteMany(),
      prisma.examResult.deleteMany(),
      prisma.exam.deleteMany(),
      prisma.gradeRange.deleteMany(),
      prisma.gradeConfig.deleteMany(),
      prisma.reportCard.deleteMany(),
      prisma.performanceAnalysis.deleteMany(),
      prisma.studentProgressReport.deleteMany(),
      prisma.teacherPerformanceReport.deleteMany(),
      prisma.parentFeedback.deleteMany(),
      prisma.pTMSlot.deleteMany(),
      prisma.pTMMeeting.deleteMany(),
      prisma.feePayment.deleteMany(),
      prisma.feeRecord.deleteMany(),
      prisma.batchEnrollment.deleteMany(),
      prisma.siblingLink.deleteMany(),
      prisma.studentDocument.deleteMany(),
      prisma.emergencyContact.deleteMany(),
      prisma.medicalInfo.deleteMany(),
      prisma.discount.deleteMany(),
      prisma.scholarship.deleteMany(),
      prisma.student.deleteMany(),
      prisma.parent.deleteMany(),
      prisma.batch.deleteMany(),
      prisma.room.deleteMany(),
      prisma.classSchedule.deleteMany(),
      prisma.teacherPerformance.deleteMany(),
      prisma.teacherDocument.deleteMany(),
      prisma.salaryRecord.deleteMany(),
      prisma.teacherLeave.deleteMany(),
      prisma.teacherAttendance.deleteMany(),
      prisma.teacherSubject.deleteMany(),
      prisma.teacher.deleteMany(),
      prisma.subject.deleteMany(),
      prisma.academicCalendar.deleteMany(),
      prisma.holiday.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.dashboardAlert.deleteMany(),
      prisma.activityLog.deleteMany(),
      prisma.passwordResetToken.deleteMany(),
      prisma.backupRecord.deleteMany(),
      prisma.academicYear.deleteMany(),
      prisma.instituteSettings.deleteMany(),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}