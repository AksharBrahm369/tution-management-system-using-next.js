import { basePrisma as prisma } from "@/lib/prisma";

export interface PublicStudentProfileData {
  id: string;
  fullName: string;
  studentCode: string;
  profilePhoto: string | null;
  email: string | null;
  phone: string | null;
  joiningDate: Date | string;
  academicYear: string;
  currentBatch: { name: string; subject?: string | null } | null;
  parent: {
    fatherName: string | null;
    fatherPhone: string | null;
    fatherEmail: string | null;
    motherName: string | null;
    motherPhone: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    primaryContact: string;
  } | null;
  stats: {
    attendancePercent: number;
    attendanceTotal: number;
    attendancePresent: number;
    attendanceAbsent: number;
    attendanceLeave: number;
    feesPaid: number;
    pendingFees: number;
  };
  attendance: Array<{
    id: string;
    date: Date | string;
    status: string;
    lateMinutes: number | null;
  }>;
  feeRecords: Array<{
    id: string;
    month: number;
    year: number;
    baseFee: number;
    discountAmount: number;
    scholarshipAmount: number;
    lateFee: number;
    otherCharges: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: string;
    dueDate: Date | string | null;
    batchName: string;
  }>;
  examResults: Array<{
    id: string;
    examName: string;
    subject: string;
    score: number;
    totalMarks: number;
    percentage: number;
    examDate: Date | string;
  }>;
}

export async function getPublicStudentProfile(studentId: string, instituteId?: string): Promise<PublicStudentProfileData | null> {
  // Build where clause - include instituteId if provided (for basePrisma queries without scoping middleware)
  const studentWhere = instituteId ? { id: studentId, instituteId } : { id: studentId };

  const student = await prisma.student.findUnique({
    where: studentWhere,
    include: {
      parent: true,
      batchEnrollments: {
        include: {
          batch: true,
        },
      },
      attendance: {
        orderBy: { date: "desc" },
        take: 30,
      },
      feeRecords: {
        include: {
          batch: true,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
      examResults: {
        include: {
          exam: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: {
          exam: { examDate: "asc" },
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const attendanceTotal = student.attendance.length;
  const attendancePresent = student.attendance.filter((item) => item.status === "PRESENT").length;
  const attendanceAbsent = student.attendance.filter((item) => item.status === "ABSENT").length;
  const attendanceLeave = student.attendance.filter((item) => item.status === "ON_LEAVE").length;
  const feePaid = student.feeRecords.reduce((sum, record) => sum + record.paidAmount, 0);
  const feePending = student.feeRecords.reduce((sum, record) => sum + record.pendingAmount, 0);

  return {
    id: student.id,
    fullName: `${student.firstName} ${student.lastName}`,
    studentCode: student.studentCode,
    profilePhoto: student.profilePhoto,
    email: student.email,
    phone: student.phone,
    joiningDate: student.joiningDate,
    academicYear: student.academicYear,
    currentBatch: student.batchEnrollments.find((enrollment) => enrollment.isActive)?.batch ?? null,
    parent: student.parent
      ? {
          fatherName: student.parent.fatherName,
          fatherPhone: student.parent.fatherPhone,
          fatherEmail: student.parent.fatherEmail,
          motherName: student.parent.motherName,
          motherPhone: student.parent.motherPhone,
          guardianName: student.parent.guardianName,
          guardianPhone: student.parent.guardianPhone,
          primaryContact: student.parent.primaryContact,
        }
      : null,
    stats: {
      attendancePercent: attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0,
      attendanceTotal,
      attendancePresent,
      attendanceAbsent,
      attendanceLeave,
      feesPaid: feePaid,
      pendingFees: feePending,
    },
    attendance: student.attendance.map((att) => ({
      id: att.id,
      date: att.date,
      status: att.status,
      lateMinutes: att.lateMinutes,
    })),
    feeRecords: student.feeRecords.map((fee) => ({
      id: fee.id,
      month: fee.month,
      year: fee.year,
      baseFee: fee.baseFee,
      discountAmount: fee.discountAmount,
      scholarshipAmount: fee.scholarshipAmount,
      lateFee: fee.lateFee,
      otherCharges: fee.otherCharges,
      totalAmount: fee.totalAmount,
      paidAmount: fee.paidAmount,
      pendingAmount: fee.pendingAmount,
      status: fee.status,
      dueDate: fee.dueDate,
      batchName: fee.batch?.name || "Batch",
    })),
    examResults: student.examResults.map((result) => {
      const examName = result.exam?.title || "Exam";
      const subject = result.exam?.subject?.name || "Unknown";
      const score = result.marksObtained || 0;
      const totalMarks = result.totalMarks || result.exam?.totalMarks || 100;
      const percentage = result.percentage || (totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0);

      return {
        id: result.id,
        examName,
        subject,
        score,
        totalMarks,
        percentage,
        examDate: result.exam?.examDate || new Date().toISOString(),
      };
    }),
  };
}
