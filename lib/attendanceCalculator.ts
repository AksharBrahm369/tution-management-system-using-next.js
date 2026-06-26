import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@prisma/client";

/**
 * Calculate attendance percentage for a student in a batch
 */
export async function calculateAttendancePercentage(
  studentId: string,
  batchId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<{ percentage: number; present: number; total: number }> {
  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      batchId,
      date: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      },
      status: {
        notIn: ["HOLIDAY", "CANCELLED"],
      },
    },
  });

  const presentCount = records.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;
  const total = records.length;
  const percentage = total > 0 ? (presentCount / total) * 100 : 0;

  return {
    percentage: Math.round(percentage * 100) / 100,
    present: presentCount,
    total,
  };
}

/**
 * Check if student has low attendance and return alert info
 */
export async function checkLowAttendance(
  studentId: string,
  batchId: string,
  threshold: number = 75
): Promise<{
  isLow: boolean;
  percentage: number;
  message: string;
} | null> {
  const { percentage } = await calculateAttendancePercentage(
    studentId,
    batchId
  );

  if (percentage < threshold) {
    return {
      isLow: true,
      percentage,
      message: `${Math.round(percentage)}% attendance. Below ${threshold}% threshold.`,
    };
  }

  return null;
}

/**
 * Get attendance summary for a batch on a specific date
 */
export async function getAttendanceSummary(
  batchId: string,
  date: Date
) {
  const records = await prisma.attendance.findMany({
    where: {
      batchId,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1
        ),
      },
    },
  });

  const summary = {
    total: records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    onLeave: records.filter((r) => r.status === "ON_LEAVE").length,
    halfDay: records.filter((r) => r.status === "HALF_DAY").length,
    percentage:
      records.length > 0
        ? Math.round(
            ((records.filter((r) => r.status === "PRESENT" || r.status === "LATE")
              .length /
              records.length) *
              100 *
              100) /
              100
          )
        : 0,
  };

  return summary;
}

/**
 * Calculate consecutive absences for a student
 */
export async function calculateConsecutiveAbsences(
  studentId: string,
  batchId: string
): Promise<number> {
  const records = await prisma.attendance.findMany({
    where: {
      studentId,
      batchId,
    },
    orderBy: {
      date: "desc",
    },
    take: 30,
  });

  let consecutiveCount = 0;
  for (const record of records) {
    if (record.status === "ABSENT") {
      consecutiveCount++;
    } else {
      break;
    }
  }

  return consecutiveCount;
}

/**
 * Get attendance summary for today across all batches
 */
export async function getTodayAttendanceSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await prisma.attendance.findMany({
    where: {
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  const summary = {
    totalPresent: records.filter((r) => r.status === "PRESENT").length,
    totalAbsent: records.filter((r) => r.status === "ABSENT").length,
    totalLate: records.filter((r) => r.status === "LATE").length,
    totalOnLeave: records.filter((r) => r.status === "ON_LEAVE").length,
    notifiedCount: records.filter((r) => r.status === "ABSENT" && r.parentNotified).length,
    percentage:
      records.length > 0
        ? Math.round(
            ((records.filter((r) => r.status === "PRESENT" || r.status === "LATE")
              .length /
              records.length) *
              100 *
              100) /
              100
          )
        : 0,
  };

  return summary;
}

/**
 * Get batch-wise attendance percentage for a date range
 */
export async function getBatchWiseAttendancePercentage(
  fromDate?: Date,
  toDate?: Date
) {
  const batches = await prisma.batch.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true }
  });

  const records = await prisma.attendance.findMany({
    where: {
      date: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lte: toDate }),
      },
      status: {
        notIn: ["HOLIDAY", "CANCELLED"],
      },
      batch: {
        status: "ACTIVE"
      }
    },
    select: {
      batchId: true,
      status: true
    }
  });

  const batchRecordsMap = new Map<string, { present: number; total: number }>();
  for (const record of records) {
    let stats = batchRecordsMap.get(record.batchId);
    if (!stats) {
      stats = { present: 0, total: 0 };
      batchRecordsMap.set(record.batchId, stats);
    }
    stats.total++;
    if (record.status === "PRESENT" || record.status === "LATE") {
      stats.present++;
    }
  }

  const results = [];

  for (const batch of batches) {
    const stats = batchRecordsMap.get(batch.id);
    const present = stats?.present || 0;
    const total = stats?.total || 0;
    const percentage = total > 0 ? (present / total) * 100 : 0;

    results.push({
      batchId: batch.id,
      batchName: batch.name,
      percentage: Math.round(percentage * 100) / 100,
      present,
      total,
    });
  }

  return results;
}

/**
 * Get student-wise attendance report
 */
export async function getStudentWiseAttendanceReport(
  batchId?: string,
  fromDate?: Date,
  toDate?: Date
) {
  const students = await prisma.student.findMany({
    where: {
      ...(batchId && {
        batchEnrollments: {
          some: { batchId },
        },
      }),
    },
    include: {
      batchEnrollments: {
        include: { batch: true },
      },
    },
  });

  const results = [];

  for (const student of students) {
    const enrolledBatches = student.batchEnrollments
      .filter((e) => !batchId || e.batchId === batchId)
      .map((e) => e.batch);

    for (const batch of enrolledBatches) {
      const { percentage, present, total } =
        await calculateAttendancePercentage(student.id, batch.id, fromDate, toDate);

      results.push({
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentCode: student.studentCode,
        batchId: batch.id,
        batchName: batch.name,
        total,
        present,
        absent: total - present,
        percentage,
        status:
          percentage >= 80
            ? "GOOD"
            : percentage >= 60
              ? "WARNING"
              : "CRITICAL",
      });
    }
  }

  return results;
}
