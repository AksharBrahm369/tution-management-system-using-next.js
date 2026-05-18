import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

/**
 * Notify parents of absent students
 */
export async function notifyAbsentParents(
  absentStudents: Array<{
    studentId: string;
    batchId: string;
    date: Date;
    batchName: string;
  }>
): Promise<{
  sent: number;
  failed: number;
  messages: string[];
}> {
  let sent = 0;
  let failed = 0;
  const messages: string[] = [];

  for (const record of absentStudents) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: record.studentId },
        include: { parent: true },
      });

      if (!student || !student.parent) {
        failed++;
        messages.push(`No parent contact found for ${student?.firstName}`);
        continue;
      }

      // Get parent contact
      const parentPhone =
        student.parent.fatherPhone || student.parent.motherPhone;
      const parentName =
        student.parent.fatherName || student.parent.motherName || "Parent";

      if (!parentPhone) {
        failed++;
        messages.push(`No phone number for parent of ${student.firstName}`);
        continue;
      }

      // Generate message from template
      const messageTemplate = `Dear ${parentName},\n\nThis is to inform you that your child ${student.firstName} ${student.lastName} was absent from ${record.batchName} class on ${new Date(record.date).toLocaleDateString()}.\n\nPlease ensure regular attendance.\n\nFor queries, contact: +91-XXXXX-XXXXX\n\nRegards,\nTuitionPro`;

      // Mock WhatsApp/SMS send (in production, use Twilio or WhatsApp Business API)
      console.log(`[NOTIFICATION] Sending to ${parentPhone}:\n${messageTemplate}`);

      // Create notification record
      await prisma.attendanceNotification.create({
        data: {
          studentId: record.studentId,
          batchId: record.batchId,
          date: record.date,
          status: "ABSENT",
          sentTo: parentName,
          sentVia: "WHATSAPP",
          message: messageTemplate,
          isSent: true,
          sentAt: new Date(),
        },
      });

      // Update parentNotified in the corresponding Attendance record
      await prisma.attendance.updateMany({
        where: {
          studentId: record.studentId,
          batchId: record.batchId,
          date: record.date,
        },
        data: {
          parentNotified: true,
          notifiedAt: new Date(),
        },
      });

      sent++;
      messages.push(`Notification sent to ${parentName} (${parentPhone})`);
    } catch (error) {
      failed++;
      messages.push(
        `Error sending notification: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return { sent, failed, messages };
}

/**
 * Send low attendance alert to parents
 */
export async function sendLowAttendanceAlert(
  studentId: string,
  batchId: string,
  percentage: number
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: true,
        batchEnrollments: {
          where: { batchId },
          include: { batch: true },
        },
      },
    });

    if (!student || !student.parent || student.batchEnrollments.length === 0) {
      return {
        success: false,
        message: "Student or parent information not found",
      };
    }

    const batch = student.batchEnrollments[0].batch;
    const parentName =
      student.parent.fatherName || student.parent.motherName || "Parent";
    const parentPhone =
      student.parent.fatherPhone || student.parent.motherPhone;

    if (!parentPhone) {
      return {
        success: false,
        message: "No phone number for parent",
      };
    }

    // Generate low attendance message
    const messageTemplate = `Dear ${parentName},\n\nImportant: Your child ${student.firstName} ${student.lastName}'s attendance in ${batch.name} is currently ${Math.round(percentage)}%, which is below the required 75%.\n\nThis requires immediate attention. Please ensure regular class attendance.\n\nContact us for more details: +91-XXXXX-XXXXX\n\nRegards,\nTuitionPro`;

    // Mock send
    console.log(`[LOW_ATTENDANCE_ALERT] Sending to ${parentPhone}:\n${messageTemplate}`);

    // Create notification record
    await prisma.attendanceNotification.create({
      data: {
        studentId,
        batchId,
        date: new Date(),
        status: "ABSENT" as AttendanceStatus,
        sentTo: parentName,
        sentVia: "WHATSAPP",
        message: messageTemplate,
        isSent: true,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Low attendance alert sent to ${parentName}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send bulk reminders to parents of students below threshold
 */
export async function sendBulkReminders(
  studentIds?: string[],
  threshold: number = 75,
  channels: string[] = ["WHATSAPP"]
): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{ studentId: string; status: string; message: string }>;
}> {
  const results = [];
  let sent = 0;
  let failed = 0;

  try {
    // Get students below threshold
    let students = await prisma.student.findMany({
      include: {
        parent: true,
        batchEnrollments: {
          where: { isActive: true },
          include: { batch: true },
        },
      },
    });

    if (studentIds && studentIds.length > 0) {
      students = students.filter((s) => studentIds.includes(s.id));
    }

    for (const student of students) {
      try {
        for (const enrollment of student.batchEnrollments) {
          // Check attendance percentage
          const records = await prisma.attendance.findMany({
            where: {
              studentId: student.id,
              batchId: enrollment.batchId,
              status: {
                notIn: ["HOLIDAY", "CANCELLED"],
              },
            },
          });

          if (records.length === 0) continue;

          const presentCount = records.filter(
            (r) => r.status === "PRESENT" || r.status === "LATE"
          ).length;
          const percentage = (presentCount / records.length) * 100;

          if (percentage < threshold) {
            const parentName =
              student.parent?.fatherName ||
              student.parent?.motherName ||
              "Parent";
            const parentPhone =
              student.parent?.fatherPhone || student.parent?.motherPhone;

            if (!parentPhone) {
              failed++;
              results.push({
                studentId: student.id,
                status: "FAILED",
                message: "No contact number",
              });
              continue;
            }

            const messageTemplate = `Dear ${parentName}, your child ${student.firstName} has ${Math.round(percentage)}% attendance in ${enrollment.batch.name}. This is below 75%. Please ensure regular attendance.`;

            console.log(
              `[BULK_REMINDER] Sending to ${parentPhone}:\n${messageTemplate}`
            );

            // Create notification
            await prisma.attendanceNotification.create({
              data: {
                studentId: student.id,
                batchId: enrollment.batchId,
                date: new Date(),
                status: "ABSENT" as AttendanceStatus,
                sentTo: parentName,
                sentVia: channels[0] || "WHATSAPP",
                message: messageTemplate,
                isSent: true,
                sentAt: new Date(),
              },
            });

            sent++;
            results.push({
              studentId: student.id,
              status: "SUCCESS",
              message: `Sent to ${parentName}`,
            });
          }
        }
      } catch (error) {
        failed++;
        results.push({
          studentId: student.id,
          status: "FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: students.length,
      sent,
      failed,
      results,
    };
  } catch (error) {
    return {
      total: 0,
      sent: 0,
      failed: 1,
      results: [
        {
          studentId: "all",
          status: "FAILED",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }
}

/**
 * Message templates
 */
export const MESSAGE_TEMPLATES = {
  ABSENT: (parentName: string, studentName: string, batchName: string, date: string) =>
    `Dear ${parentName}, your child ${studentName} was absent from ${batchName} class on ${date}. Please ensure regular attendance. - TuitionPro`,

  LOW_ATTENDANCE: (
    parentName: string,
    studentName: string,
    percentage: number,
    threshold: number
  ) =>
    `Dear ${parentName}, ${studentName}'s attendance is ${Math.round(percentage)}%, which is below ${threshold}%. Please ensure regular attendance. - TuitionPro`,

  PRESENT: (studentName: string, batchName: string) =>
    `Your child ${studentName} is marked present in ${batchName} today. - TuitionPro`,
};
