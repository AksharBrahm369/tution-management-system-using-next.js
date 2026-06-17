import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { createDefaultSettings } from "../lib/settings";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } }) : new Pool();
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const SEED_INSTITUTE_ID = "seed-default-institute";
type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED" | "TRANSFERRED" | "ON_LEAVE";
type StudentCategory = "WEAK" | "AVERAGE" | "GOOD" | "TOPPER";

type SeedStudent = {
  code: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  phone: string;
  city: string;
  fatherName: string;
  fatherPhone: string;
  status: StudentStatus;
  category: StudentCategory;
};

const subjects = [
  { name: "Mathematics", code: "MATH" },
  { name: "Physics", code: "PHY" },
  { name: "Chemistry", code: "CHEM" },
  { name: "Biology", code: "BIO" },
  { name: "English", code: "ENG" },
  { name: "Hindi", code: "HIN" },
  { name: "History", code: "HIST" },
  { name: "Geography", code: "GEO" },
  { name: "Computer Science", code: "CS" },
  { name: "Accountancy", code: "ACC" },
];

const teachers = [
  { name: "Rahul Sharma", code: "TCH-2025-001", email: "rahul@tuitionpro.com", phone: "9876543210", subjectCode: "MATH", employment: "FULL_TIME", salaryType: "FIXED", salary: 25000 },
  { name: "Priya Mehta", code: "TCH-2025-002", email: "priya@tuitionpro.com", phone: "9876543220", subjectCode: "PHY", employment: "FULL_TIME", salaryType: "FIXED", salary: 22000 },
  { name: "Amit Verma", code: "TCH-2025-003", email: "amit@tuitionpro.com", phone: "9876543230", subjectCode: "CHEM", employment: "PART_TIME", salaryType: "PER_CLASS", salary: 500 },
  { name: "Sneha Joshi", code: "TCH-2025-004", email: "sneha@tuitionpro.com", phone: "9876543240", subjectCode: "ENG", employment: "VISITING", salaryType: "PER_CLASS", salary: 400 },
  { name: "Vikram Patel", code: "TCH-2025-005", email: "vikram@tuitionpro.com", phone: "9876543250", subjectCode: "CS", employment: "FULL_TIME", salaryType: "FIXED", salary: 28000 },
];

const students: SeedStudent[] = [
  { code: "STU-2025-001", firstName: "Aarav", lastName: "Shah", gender: "MALE", phone: "9876543210", city: "Mumbai", fatherName: "Rajesh Shah", fatherPhone: "9876543211", status: "ACTIVE", category: "GOOD" },
  { code: "STU-2025-002", firstName: "Priya", lastName: "Patel", gender: "FEMALE", phone: "9876543220", city: "Mumbai", fatherName: "Suresh Patel", fatherPhone: "9876543221", status: "ACTIVE", category: "TOPPER" },
  { code: "STU-2025-003", firstName: "Darshan", lastName: "Zala", gender: "MALE", phone: "9876543230", city: "Ahmedabad", fatherName: "Mahesh Zala", fatherPhone: "9876543231", status: "ACTIVE", category: "GOOD" },
  { code: "STU-2025-004", firstName: "Kiara", lastName: "Shah", gender: "FEMALE", phone: "9876543240", city: "Surat", fatherName: "Anil Shah", fatherPhone: "9876543241", status: "ON_LEAVE", category: "AVERAGE" },
  { code: "STU-2025-005", firstName: "Vihaan", lastName: "Mehta", gender: "MALE", phone: "9876543250", city: "Rajkot", fatherName: "Nilesh Mehta", fatherPhone: "9876543251", status: "SUSPENDED", category: "WEAK" },
];

async function ensureSeedInstitute() {
  return prisma.institute.upsert({
    where: { id: SEED_INSTITUTE_ID },
    update: {
      name: "TuitionPro Demo Institute",
      slug: "tuitionpro-demo",
    },
    create: {
      id: SEED_INSTITUTE_ID,
      name: "TuitionPro Demo Institute",
      slug: "tuitionpro-demo",
    },
  });
}

async function ensureAdminUser(instituteId: string) {
  const password = await bcryptjs.hash("Darshan@369", 12);
  const adminData = {
    instituteId,
    name: "Darshan Zala",
    email: "darshanzala369@gmail.com",
    password,
    role: "SUPER_ADMIN" as const,
    isActive: true,
    isVerified: true,
  };

  const existing = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const admin = existing
    ? await prisma.user.update({
      where: { id: existing.id },
      data: { email: adminData.email, password: adminData.password, name: adminData.name, instituteId },
    })
    : await prisma.user.create({ data: adminData });

  await prisma.institute.update({
    where: { id: instituteId },
    data: { ownerId: admin.id },
  });

  return admin;
}

async function backfillSeedInstitute(instituteId: string) {
  const scopedModels = [
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
  ];

  await prisma.user.updateMany({ where: { instituteId: null }, data: { instituteId } });

  for (const modelName of scopedModels) {
    const delegate = (prisma as unknown as Record<string, { updateMany?: Function }>)[modelName];
    if (!delegate?.updateMany) continue;
    await delegate.updateMany({ where: { instituteId: null }, data: { instituteId } });
  }
}

async function main() {
  const institute = await ensureSeedInstitute();
  await ensureAdminUser(institute.id);

  // Module 5 cleanup
  await prisma.classSession.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.conflictLog.deleteMany();
  await prisma.academicCalendar.deleteMany();
  await prisma.holiday.deleteMany();

  await prisma.classSchedule.deleteMany();
  await prisma.teacherPerformance.deleteMany();
  await prisma.teacherDocument.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.teacherLeave.deleteMany();
  await prisma.teacherAttendance.deleteMany();
  await prisma.teacherSubject.deleteMany();
  
  // Module 6 cleanup
  await prisma.attendanceNotification.deleteMany();
  await prisma.attendanceAlert.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.attendance.deleteMany();

  // Module 12 cleanup
  await prisma.followUp.deleteMany();
  await prisma.demoClass.deleteMany();
  await prisma.enquiry.deleteMany();
  
  // Module 3 cleanup
  await prisma.studentActivity.deleteMany();
  await prisma.onlineAttempt.deleteMany();
  await prisma.studentAnswer.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.gradeRange.deleteMany();
  await prisma.gradeConfig.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.performanceAnalysis.deleteMany();
  await prisma.studentProgressReport.deleteMany();
  await prisma.teacherPerformanceReport.deleteMany();
  await prisma.parentFeedback.deleteMany();
  await prisma.pTMSlot.deleteMany();
  await prisma.pTMMeeting.deleteMany();
  // Fee payments reference fee records, delete payments first to avoid FK constraint errors
  await prisma.feePayment.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.batchEnrollment.deleteMany();
  await prisma.siblingLink.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.medicalInfo.deleteMany();
  // Discounts and scholarships reference students — delete them first
  await prisma.discount.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.room.deleteMany();
  
  // Module 13 cleanup and seed
  await prisma.backupRecord.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.instituteSettings.deleteMany();
  
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();

  // Seed Subjects
  const createdSubjects = [];
  for (const sub of subjects) {
    createdSubjects.push(await prisma.subject.create({ data: sub }));
  }

  // Seed Teachers
  const createdTeachers = [];
  for (const t of teachers) {
    const subject = createdSubjects.find(s => s.code === t.subjectCode);
    const firstName = t.name.split(" ")[0];
    const lastName = t.name.split(" ").slice(1).join(" ");
    
    const teacher = await prisma.teacher.create({
      data: {
        teacherCode: t.code,
        firstName,
        lastName,
        email: t.email,
        phone: t.phone,
        gender: "MALE", // Defaulting for simplicity in seed
        employmentType: t.employment as any,
        salaryType: t.salaryType as any,
        fixedSalary: t.salaryType === "FIXED" ? t.salary : null,
        perClassRate: t.salaryType === "PER_CLASS" ? t.salary : null,
        status: "ACTIVE",
        subjects: {
          create: {
            subjectId: subject!.id,
            isPrimary: true
          }
        }
      }
    });
    createdTeachers.push(teacher);
  }

  // Seed Batches
  const batches = [
    {
      code: "BCH-2025-001",
      name: "Grade 10 - Mathematics Morning",
      subjectId: createdSubjects.find(s => s.code === "MATH")?.id,
      teacherId: createdTeachers.find(t => t.teacherCode === "TCH-2025-001")?.id,
      days: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      startTime: "16:00",
      endTime: "17:30",
      durationMinutes: 90,
      academicYear: "2025-26",
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 11, 31),
      maxStrength: 30,
      fees: 1500,
      status: "ACTIVE",
      color: "#3B82F6",
    },
    {
      code: "BCH-2025-002",
      name: "Grade 9 - Physics Evening",
      subjectId: createdSubjects.find(s => s.code === "PHY")?.id,
      teacherId: createdTeachers.find(t => t.teacherCode === "TCH-2025-002")?.id,
      days: ["TUESDAY", "THURSDAY", "SATURDAY"],
      startTime: "17:00",
      endTime: "18:30",
      durationMinutes: 90,
      academicYear: "2025-26",
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 11, 31),
      maxStrength: 25,
      fees: 1200,
      status: "ACTIVE",
      color: "#8B5CF6",
    },
    {
      code: "BCH-2025-003",
      name: "Grade 11 - Chemistry",
      subjectId: createdSubjects.find(s => s.code === "CHEM")?.id,
      teacherId: createdTeachers.find(t => t.teacherCode === "TCH-2025-003")?.id,
      days: ["MONDAY", "WEDNESDAY"],
      startTime: "18:00",
      endTime: "19:30",
      durationMinutes: 90,
      academicYear: "2025-26",
      startDate: new Date(2025, 2, 1),
      endDate: new Date(2025, 11, 31),
      maxStrength: 20,
      fees: 1800,
      status: "UPCOMING",
      color: "#10B981",
    },
    {
      code: "BCH-2025-004",
      name: "Grade 12 - English Communication",
      subjectId: createdSubjects.find(s => s.code === "ENG")?.id,
      teacherId: createdTeachers.find(t => t.teacherCode === "TCH-2025-004")?.id,
      days: ["TUESDAY", "FRIDAY"],
      startTime: "15:00",
      endTime: "16:00",
      durationMinutes: 60,
      academicYear: "2025-26",
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 11, 31),
      maxStrength: 30,
      fees: 1000,
      status: "ACTIVE",
      color: "#F59E0B",
    },
  ];

  const createdBatches = await Promise.all(batches.map((batch) => prisma.batch.create({ data: batch as any })));
  const createdStudents: Array<{ id: string; studentCode: string; firstName: string; lastName: string }> = [];

  for (const [index, student] of students.entries()) {
    const parent = await prisma.parent.create({
      data: {
        fatherName: student.fatherName,
        fatherPhone: student.fatherPhone,
        fatherEmail: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@tuitionpro.test`,
        fatherOccup: "Business",
        motherName: `${student.lastName} Mother`,
        motherPhone: `98765${String(43300 + index).slice(-5)}`,
        motherEmail: `${student.firstName.toLowerCase()}.mother@tuitionpro.test`,
        motherOccup: "Homemaker",
        primaryContact: "FATHER",
      },
    });

    const createdStudent = await prisma.student.create({
      data: {
        studentCode: student.code,
        firstName: student.firstName,
        lastName: student.lastName,
        email: `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@tuitionpro.test`,
        phone: student.phone,
        dateOfBirth: new Date(2010 - (index % 5), index % 12, 10 + (index % 10)),
        gender: student.gender,
        city: student.city,
        state: "Gujarat",
        academicYear: "2025-26",
        status: student.status,
        category: student.category,
        joiningDate: new Date(),
        parentId: parent.id,
        emergencyContacts: {
          create: [{ name: student.fatherName, relationship: "Father", phone: student.fatherPhone, isVerified: true }],
        },
        batchEnrollments: {
          create: {
            batchId: createdBatches[index % createdBatches.length].id,
            enrollDate: new Date(),
            enrolledBy: "seed",
            isActive: true,
          },
        },
      },
    });

    createdStudents.push(createdStudent);
  }

  // Seed Rooms
  const rooms = [
    { name: "Room 101", code: "R101", capacity: 35, floor: "1st", building: "Main Building", facilities: ["Whiteboard", "Air Conditioning"] },
    { name: "Room 102", code: "R102", capacity: 30, floor: "1st", building: "Main Building", facilities: ["Whiteboard", "Projector"] },
    { name: "Computer Lab", code: "CLAB", capacity: 25, floor: "2nd", building: "Main Building", facilities: ["Computer", "WiFi", "Air Conditioning"] },
    { name: "Science Lab", code: "SLAB", capacity: 20, floor: "Ground", building: "Science Block", facilities: ["Whiteboard"] },
  ];
  const createdRooms = [];
  for (const room of rooms) {
    createdRooms.push(await prisma.room.create({ data: room }));
  }

  // Seed Holidays
  const holidays = [
    { name: "Republic Day", date: new Date(new Date().getFullYear(), 0, 26), type: "NATIONAL" as const, affectsAll: true },
    { name: "Holi", date: new Date(new Date().getFullYear(), 2, 14), type: "NATIONAL" as const, affectsAll: true },
    { name: "Independence Day", date: new Date(new Date().getFullYear(), 7, 15), type: "NATIONAL" as const, affectsAll: true },
    { name: "Dussehra", date: new Date(new Date().getFullYear(), 9, 2), type: "NATIONAL" as const, affectsAll: true },
    { name: "Diwali", date: new Date(new Date().getFullYear(), 10, 1), type: "NATIONAL" as const, affectsAll: true },
    { name: "Christmas", date: new Date(new Date().getFullYear(), 11, 25), type: "NATIONAL" as const, affectsAll: true },
  ];
  await prisma.holiday.createMany({ data: holidays });

  // Seed Calendar Events  
  const adminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  await prisma.academicCalendar.createMany({
    data: [
      { title: "Annual Exam Season", startDate: new Date(new Date().getFullYear(), 2, 1), endDate: new Date(new Date().getFullYear(), 2, 31), type: "EXAM", color: "#EF4444", createdBy: adminUser!.id },
      { title: "Parent-Teacher Meeting", startDate: new Date(new Date().getFullYear(), 3, 15), type: "PTM", color: "#8B5CF6", isAllDay: true, createdBy: adminUser!.id },
      { title: "Enrollment Period 2025-26", startDate: new Date(new Date().getFullYear(), 3, 1), endDate: new Date(new Date().getFullYear(), 4, 31), type: "ENROLLMENT", color: "#10B981", createdBy: adminUser!.id },
    ],
  });

  const academicYearPrevious = await prisma.academicYear.create({
    data: {
      name: "2024-25",
      startDate: new Date(2024, 3, 1),
      endDate: new Date(2025, 2, 31),
      isCurrent: false,
      isActive: true,
    },
  });

  const academicYearCurrent = await prisma.academicYear.create({
    data: {
      name: "2025-26",
      startDate: new Date(2025, 3, 1),
      endDate: new Date(2026, 2, 31),
      isCurrent: true,
      isActive: true,
    },
  });

  const defaultSettings = createDefaultSettings();
  await prisma.instituteSettings.create({
    data: {
      ...defaultSettings,
      currentAcademicYear: academicYearCurrent.name,
      academicYears: [academicYearPrevious.name, academicYearCurrent.name],
    },
  });

  await prisma.backupRecord.create({
    data: {
      fileName: "seed-backup.json",
      fileUrl: "/backups/seed-backup.json",
      fileSize: "12.4 KB",
      type: "MANUAL",
      status: "COMPLETED",
      triggeredBy: adminUser!.id,
      completedAt: new Date(),
    },
  });

  console.log(`Seeded ${createdSubjects.length} subjects, ${createdTeachers.length} teachers, ${createdStudents.length} students, ${createdBatches.length} batches, ${createdRooms.length} rooms, ${holidays.length} holidays.`);

  // ─── Seed Attendance Data (Module 6) ──────────────────────────────────────

  // Generate attendance for past 30 days
  const today = new Date();
  const pastDays = 30;
  const attendanceStatuses = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE"];
  const adminUser2 = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

  // Track for alerts
  const studentAttendanceCounts: { [key: string]: { total: number; present: number } } = {};

  for (let dayOffset = pastDays; dayOffset > 0; dayOffset--) {
    const attendanceDate = new Date(today);
    attendanceDate.setDate(attendanceDate.getDate() - dayOffset);
    
    // Skip holidays
    const isHoliday = holidays.some(h => {
      const hDate = new Date(h.date);
      return hDate.getDate() === attendanceDate.getDate() &&
             hDate.getMonth() === attendanceDate.getMonth() &&
             hDate.getFullYear() === attendanceDate.getFullYear();
    });

    if (isHoliday) continue;

    // Skip Sundays
    if (attendanceDate.getDay() === 0) continue;

    for (const batch of createdBatches) {
      // Check if batch has class on this day
      const dayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][attendanceDate.getDay()];
      if (!(batch.days as string[]).includes(dayName)) continue;

      const enrollments = await prisma.batchEnrollment.findMany({
        where: { batchId: batch.id, isActive: true },
        include: { student: true },
      });

      // Create attendance records for each student
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let leaveCount = 0;

      for (const enrollment of enrollments) {
        const statusIndex = Math.floor(Math.random() * 100);
        let status: string;

        if (statusIndex < 80) status = "PRESENT";
        else if (statusIndex < 90) status = "LATE";
        else if (statusIndex < 95) status = "ON_LEAVE";
        else status = "ABSENT";

        const lateMinutes = status === "LATE" ? Math.floor(Math.random() * 30) + 5 : undefined;
        const arrivalTime = status === "LATE" ? `${String(Math.floor(Math.random() * 12) + 13).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}` : undefined;

        await prisma.attendance.create({
          data: {
            studentId: enrollment.studentId,
            batchId: batch.id,
            date: attendanceDate,
            status: status as any,
            markedAt: new Date(),
            markedBy: "seed",
            lateMinutes,
            arrivalTime,
            parentNotified: status === "ABSENT" || status === "HALF_DAY",
            notifiedAt: status === "ABSENT" || status === "HALF_DAY" ? new Date() : undefined,
          },
        });

        // Count for session summary
        if (status === "PRESENT") presentCount++;
        else if (status === "ABSENT") absentCount++;
        else if (status === "LATE") lateCount++;
        else if (status === "ON_LEAVE") leaveCount++;

        // Track for attendance percentage
        const key = `${enrollment.studentId}-${batch.id}`;
        if (!studentAttendanceCounts[key]) {
          studentAttendanceCounts[key] = { total: 0, present: 0 };
        }
        studentAttendanceCounts[key].total++;
        if (status === "PRESENT" || status === "LATE") {
          studentAttendanceCounts[key].present++;
        }
      }

      // Create attendance session record
      await prisma.attendanceSession.create({
        data: {
          batchId: batch.id,
          date: attendanceDate,
          markedBy: "seed",
          markedAt: new Date(),
          isComplete: true,
          completedAt: new Date(),
          totalStudents: enrollments.length,
          presentCount,
          absentCount,
          lateCount,
          leaveCount,
        },
      });
    }
  }

  // Create attendance alerts for low attendance students
  const alertThreshold = 75;
  for (const key in studentAttendanceCounts) {
    const [studentId, batchId] = key.split("-");
    const { total, present } = studentAttendanceCounts[key];
    const percentage = total > 0 ? (present / total) * 100 : 0;

    if (percentage < alertThreshold) {
      await prisma.attendanceAlert.create({
        data: {
          studentId,
          batchId,
          alertType: percentage < 60 ? "LOW_ATTENDANCE" : "LOW_ATTENDANCE",
          currentPercent: percentage,
          threshold: alertThreshold,
          message: `${Math.round(percentage)}% attendance. Below ${alertThreshold}% threshold.`,
          isRead: false,
          isResolved: false,
        },
      });
    }
  }

  // Create sample notifications
  const sampleStudents = createdStudents.slice(0, 3);
  for (const student of sampleStudents) {
    await prisma.attendanceNotification.create({
      data: {
        studentId: student.id,
        batchId: createdBatches[0].id,
        date: new Date(),
        status: "ABSENT",
        sentTo: student.firstName,
        sentVia: "WHATSAPP",
        message: `Dear Parent, ${student.firstName} was absent from class today.`,
        isSent: true,
        sentAt: new Date(),
      },
    });
  }

  // ─── Seed Fee Structures, FeeRecords and Payments (Module 7) ─────────────
  const feeStructuresData = [
    {
      name: "Standard Class 10",
      description: "Standard tuition structure for Grade 10",
      academicYear: "2025-26",
      tuitionFee: 1500,
      admissionFee: 0,
      examFee: 0,
      materialFee: 0,
      otherFee: 0,
      totalFee: 1500,
      isGSTApplicable: false,
      lateFeeEnabled: true,
      lateFeeType: "FIXED",
      lateFeeAmount: 50,
      lateFeeAfterDays: 5,
      dueDateType: "DAY_OF_MONTH",
      dueDateDay: 10,
      batchId: createdBatches[0].id,
    },
    {
      name: "Standard Class 9",
      description: "Standard tuition structure for Grade 9",
      academicYear: "2025-26",
      tuitionFee: 1200,
      totalFee: 1200,
      isGSTApplicable: false,
      lateFeeEnabled: true,
      lateFeeType: "FIXED",
      lateFeeAmount: 30,
      lateFeeAfterDays: 5,
      dueDateType: "DAY_OF_MONTH",
      dueDateDay: 10,
      batchId: createdBatches[1].id,
    },
    {
      name: "English Classes",
      description: "English communication classes",
      academicYear: "2025-26",
      tuitionFee: 1000,
      totalFee: 1000,
      isGSTApplicable: false,
      lateFeeEnabled: true,
      lateFeeType: "FIXED",
      lateFeeAmount: 25,
      lateFeeAfterDays: 5,
      dueDateType: "DAY_OF_MONTH",
      dueDateDay: 10,
      batchId: createdBatches[3].id,
    },
  ];

  const createdFeeStructures = [];
  for (const fs of feeStructuresData) {
    createdFeeStructures.push(await prisma.feeStructure.create({ data: fs as any }));
  }

  // Generate FeeRecords for last 3 months for all active enrollments
  const enrollments = await prisma.batchEnrollment.findMany({ where: { isActive: true }, include: { student: true, batch: true } });
  const now = new Date();
  const monthsToGenerate = [0, 1, 2].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  for (const enrollment of enrollments) {
    const feeStructure = await prisma.feeStructure.findFirst({ where: { batchId: enrollment.batchId } });
    for (const m of monthsToGenerate) {
      const exists = await prisma.feeRecord.findFirst({ where: { studentId: enrollment.studentId, batchId: enrollment.batchId, month: m.month, year: m.year } });
      if (exists) continue;

      const baseFee = feeStructure ? feeStructure.tuitionFee : enrollment.batch.fees || 0;
      const gstAmount = feeStructure && feeStructure.isGSTApplicable ? (baseFee * (feeStructure.gstPercentage || 18)) / 100 : 0;
      const totalAmount = baseFee + gstAmount;

      // Determine status by weighted random
      const r = Math.random() * 100;
      let status: any = "PENDING";
      let paidAmount = 0;

      if (r < 60) {
        status = "PAID";
        paidAmount = totalAmount;
      } else if (r < 80) {
        status = "PENDING";
        paidAmount = 0;
      } else if (r < 95) {
        status = "PARTIAL";
        paidAmount = parseFloat((totalAmount * (0.2 + Math.random() * 0.6)).toFixed(2));
      } else {
        status = "OVERDUE";
        paidAmount = 0;
      }

      const pendingAmount = parseFloat((totalAmount - paidAmount).toFixed(2));
      const dueDate = new Date(m.year, m.month - 1, feeStructure ? feeStructure.dueDateDay || 10 : 10);

      const receiptNumber = `RCP-${m.year}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const feeRecord = await prisma.feeRecord.create({
        data: {
          receiptNumber,
          studentId: enrollment.studentId,
          batchId: enrollment.batchId,
          feeStructureId: feeStructure ? feeStructure.id : null,
          month: m.month,
          year: m.year,
          academicYear: enrollment.batch.academicYear,
          baseFee,
          discountAmount: 0,
          scholarshipAmount: 0,
          lateFee: 0,
          otherCharges: 0,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          paidAmount: parseFloat(paidAmount.toFixed(2)),
          pendingAmount,
          status: status as any,
          dueDate,
          isGSTApplicable: feeStructure ? feeStructure.isGSTApplicable : false,
          gstAmount: parseFloat(gstAmount.toFixed(2)),
        },
      });

      // Create payment records for PAID and PARTIAL
      if (status === "PAID" || status === "PARTIAL") {
        const paymentNumber = `PAY-${m.year}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const paymentModeOptions = ["CASH", "ONLINE", "UPI", "CHEQUE"];
        const chosenMode = paymentModeOptions[Math.floor(Math.random() * paymentModeOptions.length)];

        await prisma.feePayment.create({
          data: {
            paymentNumber,
            feeRecordId: feeRecord.id,
            amount: parseFloat(feeRecord.paidAmount.toFixed(2)),
            paymentMode: chosenMode as any,
            transactionId: chosenMode === "ONLINE" ? `TXN-${Math.random().toString(36).slice(2, 9).toUpperCase()}` : null,
            gatewayName: chosenMode === "ONLINE" ? "Razorpay" : null,
            status: "COMPLETED",
            collectedBy: "seed",
            receiptUrl: null,
          },
        });
      }
    }
  }

  // Create some sample discounts & scholarships
  if (createdStudents.length > 1) {
    await prisma.discount.create({
      data: {
        studentId: createdStudents[1].id,
        name: "Sibling Discount",
        type: "PERCENTAGE",
        value: 10,
        reason: "Sibling in institute",
        validFrom: new Date(),
        validTo: null,
        approvedBy: adminUser!.id,
      },
    });

    await prisma.scholarship.create({
      data: {
        studentId: createdStudents[2].id,
        name: "Merit Scholarship",
        description: "Top performer scholarship",
        amount: 200,
        percentage: null,
        validFrom: new Date(),
        validTo: null,
        approvedBy: adminUser!.id,
      },
    });
  }


  console.log(`✓ Seeded attendance records for past ${pastDays} days`);
  console.log(`✓ Created ${Object.keys(studentAttendanceCounts).length} student attendance records`);
  console.log(`✓ Created attendance alerts for low attendance students`);
  console.log(`✓ Created sample attendance notifications`);

  // ─── Module 8: Exams & Results Seeding ────────────────────────────────────

  // Create default Grade Config
  const gradeConfig = await prisma.gradeConfig.create({
    data: {
      name: "Standard Percentage Grading",
      description: "Default grading system used by the institute",
      isDefault: true,
      grades: {
        create: [
          { grade: "A+", minPercentage: 90, maxPercentage: 100, gradePoint: 10, remark: "Excellent", color: "#10B981" },
          { grade: "A", minPercentage: 80, maxPercentage: 89.99, gradePoint: 9, remark: "Very Good", color: "#34D399" },
          { grade: "B+", minPercentage: 70, maxPercentage: 79.99, gradePoint: 8, remark: "Good", color: "#60A5FA" },
          { grade: "B", minPercentage: 60, maxPercentage: 69.99, gradePoint: 7, remark: "Above Average", color: "#93C5FD" },
          { grade: "C", minPercentage: 50, maxPercentage: 59.99, gradePoint: 6, remark: "Average", color: "#FBBF24" },
          { grade: "D", minPercentage: 40, maxPercentage: 49.99, gradePoint: 5, remark: "Below Average", color: "#F87171" },
          { grade: "F", minPercentage: 0, maxPercentage: 39.99, gradePoint: 0, remark: "Fail", color: "#DC2626" },
        ]
      }
    }
  });

  const mathBatch = createdBatches[0];
  const phyBatch = createdBatches[1];
  const engBatch = createdBatches[3];

  // Exam 1
  const exam1 = await prisma.exam.create({
    data: {
      title: "Unit Test 1 - January",
      code: "EXM-2025-001",
      type: "UNIT_TEST",
      batchId: mathBatch.id,
      subjectId: mathBatch.subjectId,
      academicYear: "2025-26",
      examDate: new Date(2025, 0, 20),
      totalMarks: 50,
      passingMarks: 20,
      status: "RESULT_PUBLISHED",
      isResultPublished: true,
      resultPublishedAt: new Date(2025, 0, 22),
      gradingSystem: "PERCENTAGE",
      gradeConfig: JSON.stringify(gradeConfig),
      createdBy: adminUser!.id,
    }
  });

  // Exam 2
  const exam2 = await prisma.exam.create({
    data: {
      title: "Unit Test 1 - Physics",
      code: "EXM-2025-002",
      type: "UNIT_TEST",
      batchId: phyBatch.id,
      subjectId: phyBatch.subjectId,
      academicYear: "2025-26",
      examDate: new Date(2025, 0, 22),
      totalMarks: 50,
      passingMarks: 20,
      status: "RESULT_PUBLISHED",
      isResultPublished: true,
      resultPublishedAt: new Date(2025, 0, 24),
      gradingSystem: "PERCENTAGE",
      gradeConfig: JSON.stringify(gradeConfig),
      createdBy: adminUser!.id,
    }
  });

  // Exam 3
  await prisma.exam.create({
    data: {
      title: "Mid Term - Mathematics",
      code: "EXM-2025-003",
      type: "MID_TERM",
      batchId: mathBatch.id,
      subjectId: mathBatch.subjectId,
      academicYear: "2025-26",
      examDate: new Date(2025, 1, 15),
      totalMarks: 100,
      passingMarks: 35,
      status: "RESULT_PENDING",
      gradingSystem: "PERCENTAGE",
      gradeConfig: JSON.stringify(gradeConfig),
      createdBy: adminUser!.id,
    }
  });

  // Exam 4
  await prisma.exam.create({
    data: {
      title: "Class Test - English",
      code: "EXM-2025-004",
      type: "CLASS_TEST",
      batchId: engBatch.id,
      subjectId: engBatch.subjectId,
      academicYear: "2025-26",
      examDate: new Date(2025, 1, 25),
      totalMarks: 25,
      passingMarks: 10,
      status: "UPCOMING",
      gradingSystem: "PERCENTAGE",
      gradeConfig: JSON.stringify(gradeConfig),
      createdBy: adminUser!.id,
    }
  });

  // Exam 5 (Online Test)
  const exam5 = await prisma.exam.create({
    data: {
      title: "Online Quiz - Math",
      code: "EXM-2025-005",
      type: "ONLINE_TEST",
      batchId: mathBatch.id,
      subjectId: mathBatch.subjectId,
      academicYear: "2025-26",
      examDate: new Date(2025, 1, 28),
      totalMarks: 30,
      passingMarks: 12,
      status: "UPCOMING",
      gradingSystem: "PERCENTAGE",
      gradeConfig: JSON.stringify(gradeConfig),
      createdBy: adminUser!.id,
      duration: 30,
    }
  });

  // Seed Questions for Exam 5
  const questionsData = Array.from({ length: 10 }).map((_, i) => ({
    examId: exam5.id,
    questionNumber: i + 1,
    questionText: `Sample Multiple Choice Question ${i + 1} for Math Quiz`,
    questionType: "MCQ" as const,
    marks: 3,
    optionA: "Option 1",
    optionB: "Option 2",
    optionC: "Option 3",
    optionD: "Option 4",
    correctOption: "B",
    difficulty: i < 3 ? "EASY" : (i < 7 ? "MEDIUM" : "HARD") as any,
    topic: "Algebra",
  }));
  await prisma.examQuestion.createMany({ data: questionsData });

  // Generate Results for Exam 1 & 2
  const generateResults = async (exam: any, batchId: string) => {
    const studentsInBatch = await prisma.batchEnrollment.findMany({ where: { batchId, isActive: true }, include: { student: true } });
    const results = [];

    for (const enr of studentsInBatch) {
      const isAbsent = Math.random() < 0.1;
      let marks = null;
      let percent = null;

      if (!isAbsent) {
        marks = parseFloat((exam.passingMarks + Math.random() * (exam.totalMarks - exam.passingMarks + 5)).toFixed(1));
        if (marks > exam.totalMarks) marks = exam.totalMarks;
        percent = parseFloat(((marks / exam.totalMarks) * 100).toFixed(2));
      }

      results.push({
        examId: exam.id,
        studentId: enr.studentId,
        batchId: exam.batchId,
        marksObtained: marks,
        totalMarks: exam.totalMarks,
        percentage: percent,
        status: isAbsent ? "PUBLISHED" as any : "PUBLISHED" as any,
        isAbsent,
        teacherRemarks: isAbsent ? "Absent for exam" : (percent && percent > 80 ? "Excellent work" : "Needs improvement"),
        enteredBy: adminUser!.id,
        enteredAt: new Date(),
        verifiedBy: adminUser!.id,
        verifiedAt: new Date(),
      });
    }

    // Sort to calculate ranks
    const presentResults = results.filter(r => !r.isAbsent).sort((a, b) => (b.marksObtained || 0) - (a.marksObtained || 0));
    
    let currentRank = 1;
    for (let i = 0; i < presentResults.length; i++) {
      if (i > 0 && presentResults[i].marksObtained === presentResults[i-1].marksObtained) {
        (presentResults[i] as any).batchRank = (presentResults[i-1] as any).batchRank;
      } else {
        (presentResults[i] as any).batchRank = currentRank;
      }
      
      // Calculate grade
      const p = presentResults[i].percentage || 0;
      let grade = "F"; let gp = 0;
      if (p >= 90) { grade = "A+"; gp = 10; }
      else if (p >= 80) { grade = "A"; gp = 9; }
      else if (p >= 70) { grade = "B+"; gp = 8; }
      else if (p >= 60) { grade = "B"; gp = 7; }
      else if (p >= 50) { grade = "C"; gp = 6; }
      else if (p >= 40) { grade = "D"; gp = 5; }

      (presentResults[i] as any).grade = grade;
      (presentResults[i] as any).gradePoint = gp;
      currentRank++;
    }

    await prisma.examResult.createMany({ data: results });
  };

  await generateResults(exam1, mathBatch.id);
  await generateResults(exam2, phyBatch.id);

  console.log(`✓ Seeded Exams, Grade Configs and generated Exam Results`);

  // ─── Module 10: Reports & Analytics Seed Data ──────────────────────────
  // Analytics snapshots for last 90 days (daily)
  const snapshotDays = 90;
  const snapshotData: any[] = [];
  for (let i = 0; i < snapshotDays; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Small random variations
    const totalStudents = Math.max(50, 100 + Math.floor(Math.sin(i) * 5) + Math.floor(Math.random() * 10));
    const activeStudents = Math.max(40, totalStudents - Math.floor(Math.random() * 10));
    const newStudents = Math.floor(Math.random() * 3);
    const leftStudents = Math.floor(Math.random() * 2);
    const avgAttendance = parseFloat((75 + Math.random() * 20).toFixed(2));
    const presentCount = Math.floor((avgAttendance / 100) * totalStudents);
    const absentCount = totalStudents - presentCount;
    const feeCollected = parseFloat((50000 + Math.random() * 20000).toFixed(2));
    const feeDue = parseFloat((10000 + Math.random() * 10000).toFixed(2));
    const feePending = parseFloat((feeDue - (feeCollected % feeDue)).toFixed(2));
    const collectionRate = parseFloat(((feeCollected / (feeCollected + feePending || 1)) * 100).toFixed(2));
    const examsHeld = Math.floor(Math.random() * 3);
    const avgExamScore = parseFloat((50 + Math.random() * 40).toFixed(2));
    const passRate = parseFloat((60 + Math.random() * 40).toFixed(2));
    const messagesSent = Math.floor(20 + Math.random() * 100);
    const deliveryRate = parseFloat((90 + Math.random() * 10).toFixed(2));

    snapshotData.push({
      date: d,
      type: "DAILY",
      totalStudents,
      activeStudents,
      newStudents,
      leftStudents,
      avgAttendance,
      presentCount,
      absentCount,
      feeDue,
      feeCollected,
      feePending,
      collectionRate,
      examsHeld,
      avgExamScore,
      passRate,
      messagesSent,
      deliveryRate,
      createdAt: new Date(),
    });
  }

  // Insert snapshots (skipDuplicates not available for some adapters, guard with try)
  try {
    await prisma.analyticsSnapshot.createMany({ data: snapshotData });
    console.log(`✓ Seeded ${snapshotData.length} analytics snapshots`);
  } catch (e) {
    console.warn('analyticsSnapshot.createMany failed, inserting individually');
    for (const s of snapshotData) {
      await prisma.analyticsSnapshot.create({ data: s });
    }
    console.log(`✓ Seeded ${snapshotData.length} analytics snapshots (individual inserts)`);
  }

  // Sample saved reports
  const savedReports = [
    {
      name: "Monthly Fee Report",
      description: "Monthly fee collection and outstanding report",
      type: "FINANCIAL",
      category: "SCHEDULED",
      config: { tab: "overview" },
      filters: null,
      columns: ["studentCode", "studentName", "batch", "totalAmount", "paidAmount", "pendingAmount"],
      isScheduled: true,
      scheduleFrequency: "MONTHLY",
      scheduleDay: 1,
      scheduleTime: "02:00",
      emailEnabled: true,
      emailRecipients: [adminUser!.email],
      createdBy: adminUser!.id,
    },
    {
      name: "Weekly Attendance Summary",
      description: "Weekly summary of attendance for all batches",
      type: "ATTENDANCE",
      category: "SCHEDULED",
      config: { tab: "weekly" },
      filters: null,
      columns: ["batch", "present", "absent", "attendancePercent"],
      isScheduled: true,
      scheduleFrequency: "WEEKLY",
      scheduleDay: new Date().getDay() || 1,
      scheduleTime: "07:00",
      emailEnabled: true,
      emailRecipients: [adminUser!.email],
      createdBy: adminUser!.id,
    },
    {
      name: "Student Progress Report",
      description: "On-demand student progress report",
      type: "STUDENT_PROGRESS",
      category: "CUSTOM",
      config: { previewRows: 10 },
      filters: null,
      columns: ["studentCode", "studentName", "attendancePercent", "avgScore", "rank"],
      isScheduled: false,
      emailEnabled: false,
      emailRecipients: [],
      createdBy: adminUser!.id,
    },
  ];

  for (const r of savedReports) {
    try {
      await prisma.report.create({ data: r as any });
    } catch (e) {
      console.warn('report.create failed for', r.name, e);
    }
  }

  // StudentProgressReport records for last 3 months
  const progressMonths = [0, 1, 2].map((i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const progressData: any[] = [];
  for (const student of createdStudents) {
    const batchId = (await prisma.batchEnrollment.findFirst({ where: { studentId: student.id, isActive: true } }))?.batchId || createdBatches[0].id;
    for (const m of progressMonths) {
      const attendancePercent = parseFloat((60 + Math.random() * 35).toFixed(2));
      const classesPresent = Math.floor((attendancePercent / 100) * 20);
      const classesAbsent = 20 - classesPresent;
      const examsTaken = Math.floor(1 + Math.random() * 3);
      const avgScore = parseFloat((50 + Math.random() * 45).toFixed(2));
      const highestScore = Math.min(100, parseFloat((avgScore + Math.random() * 15).toFixed(2)));
      const lowestScore = Math.max(0, parseFloat((avgScore - Math.random() * 20).toFixed(2)));
      const feePaid = parseFloat((Math.random() * 1500).toFixed(2));
      const feePending = parseFloat((1500 - feePaid).toFixed(2));
      const batchRank = Math.floor(1 + Math.random() * 30);
      const totalInBatch = 30;

      progressData.push({
        studentId: student.id,
        batchId,
        month: m.month,
        year: m.year,
        attendancePercent,
        classesPresent,
        classesAbsent,
        examsTaken,
        avgScore,
        highestScore,
        lowestScore,
        avgGrade: null,
        feeStatus: feePending > 0 ? "PENDING" : "PAID",
        feePaid,
        feePending,
        batchRank,
        totalInBatch,
        overallRating: attendancePercent > 80 && avgScore > 80 ? "Excellent" : attendancePercent > 70 && avgScore > 65 ? "Good" : "Needs Attention",
        teacherComment: null,
        adminComment: null,
      });
    }
  }

  try {
    await prisma.studentProgressReport.createMany({ data: progressData });
    console.log(`✓ Seeded ${progressData.length} student progress reports`);
  } catch (e) {
    console.warn('studentProgressReport.createMany failed, inserting individually');
    for (const p of progressData) {
      await prisma.studentProgressReport.create({ data: p });
    }
    console.log(`✓ Seeded ${progressData.length} student progress reports (individual inserts)`);
  }

  // Teacher performance reports (last 3 months)
  const teacherPerfData: any[] = [];
  for (const t of createdTeachers) {
    for (const m of progressMonths) {
      teacherPerfData.push({
        teacherId: t.id,
        month: m.month,
        year: m.year,
        attendancePercent: parseFloat((80 + Math.random() * 15).toFixed(2)),
        daysPresent: 20 - Math.floor(Math.random() * 3),
        daysAbsent: Math.floor(Math.random() * 3),
        classesScheduled: 22,
        classesTaken: 20 - Math.floor(Math.random() * 2),
        classesCancelled: Math.floor(Math.random() * 2),
        avgStudentScore: parseFloat((60 + Math.random() * 30).toFixed(2)),
        studentPassRate: parseFloat((70 + Math.random() * 30).toFixed(2)),
        salaryStatus: "PAID",
        salaryAmount: t.fixedSalary || 0,
        rating: parseFloat((3 + Math.random() * 2).toFixed(2)),
        adminNotes: null,
      });
    }
  }

  try {
    await prisma.teacherPerformanceReport.createMany({ data: teacherPerfData });
    console.log(`✓ Seeded ${teacherPerfData.length} teacher performance reports`);
  } catch (e) {
    for (const tp of teacherPerfData) {
      await prisma.teacherPerformanceReport.create({ data: tp as any });
    }
    console.log(`✓ Seeded ${teacherPerfData.length} teacher performance reports (individual inserts)`);
  }

  // ─── Module 11: Parents, PTM, and Feedback Seed Data ───────────────────
  const sampleParent = await prisma.parent.findFirst({ include: { students: true } });
  if (sampleParent && !sampleParent.userId) {
    const parentName = sampleParent.fatherName || sampleParent.motherName || sampleParent.guardianName || "Parent";
    const parentEmail = sampleParent.fatherEmail || sampleParent.motherEmail || "parent@tuitionpro.test";
    const parentPassword = await bcryptjs.hash("Parent@505", 12);
    const existingParentUser = await prisma.user.findUnique({ where: { email: parentEmail } });
    const parentUser = existingParentUser
      ? await prisma.user.update({
          where: { email: parentEmail },
          data: {
            name: parentName,
            password: parentPassword,
            role: "PARENT",
            isActive: true,
            isVerified: true,
          },
        })
      : await prisma.user.create({
          data: {
            name: parentName,
            email: parentEmail,
            password: parentPassword,
            role: "PARENT",
            isActive: true,
            isVerified: true,
          },
        });

    await prisma.parent.update({ where: { id: sampleParent.id }, data: { userId: parentUser.id } });
  }

  const ptmMeeting = await prisma.pTMMeeting.create({
    data: {
      title: "February Parent Meeting",
      description: "Monthly parent-teacher interaction and progress discussion.",
      meetingDate: new Date(2025, 1, 15),
      startTime: "15:00",
      endTime: "18:00",
      venue: "Conference Room",
      isOnline: false,
      isForAll: true,
      status: "SCHEDULED",
      createdBy: adminUser!.id,
    },
  });

  if (sampleParent && sampleParent.students.length > 0) {
    const primaryStudent = sampleParent.students[0];
    const teacher = createdTeachers[0];
    const enrollment = await prisma.batchEnrollment.findFirst({ where: { studentId: primaryStudent.id, isActive: true } });
    const batchId = enrollment?.batchId ?? null;
    await prisma.pTMSlot.create({
      data: {
        meetingId: ptmMeeting.id,
        parentId: sampleParent.id,
        studentId: primaryStudent.id,
        teacherId: teacher.id,
        slotTime: "15:30",
        duration: 15,
        status: "BOOKED",
        notes: "Discuss attendance and exam preparation.",
        adminNotes: "Seeded PTM slot",
      },
    });

    const secondaryParent = await prisma.parent.findFirst({ where: { id: { not: sampleParent.id } }, include: { students: true } });
    const secondaryStudent = secondaryParent?.students[0];
    if (secondaryParent && secondaryStudent) {
      await prisma.pTMSlot.create({
        data: {
          meetingId: ptmMeeting.id,
          parentId: secondaryParent.id,
          studentId: secondaryStudent.id,
          teacherId: null,
          slotTime: "16:00",
          duration: 15,
          status: "AVAILABLE",
        },
      });
    }

    await prisma.parentFeedback.createMany({
      data: [
        {
          parentId: sampleParent.id,
          studentId: primaryStudent.id,
          teacherId: teacher.id,
          batchId,
          subject: "Schedule concern",
          message: "Request to adjust class timing by 30 minutes.",
          type: "COMPLAINT",
          status: "OPEN",
        },
        {
          parentId: sampleParent.id,
          studentId: primaryStudent.id,
          teacherId: teacher.id,
          batchId,
          subject: "Teacher appreciation",
          message: "Thanks for the consistent support and feedback.",
          type: "APPRECIATION",
          status: "RESOLVED",
          adminResponse: "Shared with the teaching team.",
          respondedBy: adminUser!.id,
          respondedAt: new Date(),
        },
        {
          parentId: sampleParent.id,
          studentId: primaryStudent.id,
          teacherId: null,
          batchId,
          subject: "Fee query",
          message: "Need clarification on the next fee due date.",
          type: "QUERY",
          status: "IN_PROGRESS",
        },
      ],
    });
  }

  console.log(`✓ Seeded sample PTM meeting and parent feedback`);

  // ─── Module 12: Enquiry Management Seed Data ───────────────────────────
  const enquirySeedData = [
    {
      enquiryNumber: "ENQ-2025-001",
      studentName: "Aarav Shah",
      studentAge: 15,
      studentClass: "Class 10",
      parentName: "Rajesh Shah",
      parentPhone: "9876543211",
      parentEmail: "rajesh.shah@example.com",
      address: "Mumbai, Maharashtra",
      interestedIn: ["Mathematics", "Science"],
      preferredBatch: "Grade 10 - Mathematics Morning",
      preferredTime: "5:00 PM",
      source: "REFERRAL" as const,
      sourceDetail: "Referred by existing parent",
      referredBy: "Priya Patel",
      status: "NEW" as const,
      priority: "HIGH" as const,
      assignedTo: "Counsellor Team",
      notes: "Wants weekend support classes.",
    },
    {
      enquiryNumber: "ENQ-2025-002",
      studentName: "Ishita Mehta",
      studentAge: 14,
      studentClass: "Class 9",
      parentName: "Nilesh Mehta",
      parentPhone: "9876543251",
      parentEmail: "nilesh.mehta@example.com",
      address: "Rajkot, Gujarat",
      interestedIn: ["Physics"],
      preferredBatch: "Grade 9 - Physics Evening",
      preferredTime: "6:00 PM",
      source: "WALK_IN" as const,
      sourceDetail: "Visited admission desk",
      referredBy: null,
      status: "CONTACTED" as const,
      priority: "NORMAL" as const,
      assignedTo: "Admissions Desk",
      notes: "Requested brochure and fee details.",
    },
    {
      enquiryNumber: "ENQ-2025-003",
      studentName: "Kiara Shah",
      studentAge: 16,
      studentClass: "Class 11",
      parentName: "Anil Shah",
      parentPhone: "9876543241",
      parentEmail: "anil.shah@example.com",
      address: "Surat, Gujarat",
      interestedIn: ["Chemistry", "Biology"],
      preferredBatch: "Grade 11 - Chemistry",
      preferredTime: "7:00 PM",
      source: "WEBSITE" as const,
      sourceDetail: "Landing page form",
      referredBy: null,
      status: "DEMO_SCHEDULED" as const,
      priority: "NORMAL" as const,
      assignedTo: "Demo Coordinator",
      notes: "Looking for science stream coaching.",
    },
    {
      enquiryNumber: "ENQ-2025-004",
      studentName: "Vihaan Patel",
      studentAge: 17,
      studentClass: "Class 12",
      parentName: "Suresh Patel",
      parentPhone: "9876543221",
      parentEmail: "suresh.patel@example.com",
      address: "Ahmedabad, Gujarat",
      interestedIn: ["English"],
      preferredBatch: "Grade 12 - English Communication",
      preferredTime: "4:00 PM",
      source: "PHONE_CALL" as const,
      sourceDetail: "Called admissions line",
      referredBy: null,
      status: "DEMO_DONE" as const,
      priority: "HIGH" as const,
      assignedTo: "Admissions Desk",
      notes: "Demo completed successfully.",
    },
    {
      enquiryNumber: "ENQ-2025-005",
      studentName: "Mahi Joshi",
      studentAge: 13,
      studentClass: "Class 8",
      parentName: "Amit Joshi",
      parentPhone: "9876543291",
      parentEmail: "amit.joshi@example.com",
      address: "Vadodara, Gujarat",
      interestedIn: ["Mathematics"],
      preferredBatch: "Grade 10 - Mathematics Morning",
      preferredTime: "5:30 PM",
      source: "SOCIAL_MEDIA" as const,
      sourceDetail: "Instagram ad",
      referredBy: null,
      status: "INTERESTED" as const,
      priority: "HIGH" as const,
      assignedTo: "Lead Executive",
      notes: "Parent wants admission this month.",
    },
    {
      enquiryNumber: "ENQ-2025-006",
      studentName: "Dev Malhotra",
      studentAge: 15,
      studentClass: "Class 10",
      parentName: "Rohan Malhotra",
      parentPhone: "9876543301",
      parentEmail: "rohan.malhotra@example.com",
      address: "Mumbai, Maharashtra",
      interestedIn: ["English", "Computer Science"],
      preferredBatch: "Grade 12 - English Communication",
      preferredTime: "3:00 PM",
      source: "WHATSAPP" as const,
      sourceDetail: "Shared through WhatsApp",
      referredBy: null,
      status: "ON_HOLD" as const,
      priority: "NORMAL" as const,
      assignedTo: "Counsellor Team",
      notes: "Waiting for board exam schedule.",
    },
    {
      enquiryNumber: "ENQ-2025-007",
      studentName: "Sara Khan",
      studentAge: 14,
      studentClass: "Class 9",
      parentName: "Farhan Khan",
      parentPhone: "9876543311",
      parentEmail: "farhan.khan@example.com",
      address: "Surat, Gujarat",
      interestedIn: ["Science"],
      preferredBatch: "Grade 9 - Physics Evening",
      preferredTime: "6:30 PM",
      source: "REFERRAL" as const,
      sourceDetail: "Referred by student parent",
      referredBy: "Rajesh Shah",
      status: "LOST" as const,
      priority: "LOW" as const,
      assignedTo: "Admissions Desk",
      notes: "Parent chose another institute.",
    },
    {
      enquiryNumber: "ENQ-2025-008",
      studentName: "Rudra Desai",
      studentAge: 12,
      studentClass: "Class 7",
      parentName: "Minal Desai",
      parentPhone: "9876543321",
      parentEmail: "minal.desai@example.com",
      address: "Rajkot, Gujarat",
      interestedIn: ["Mathematics", "Computer"],
      preferredBatch: "Grade 10 - Mathematics Morning",
      preferredTime: "4:30 PM",
      source: "PAMPHLET" as const,
      sourceDetail: "School pamphlet",
      referredBy: null,
      status: "CONTACTED" as const,
      priority: "NORMAL" as const,
      assignedTo: "Lead Executive",
      notes: "Interested in long-term coaching.",
    },
    {
      enquiryNumber: "ENQ-2025-009",
      studentName: "Nisha Verma",
      studentAge: 15,
      studentClass: "Class 10",
      parentName: "Akhil Verma",
      parentPhone: "9876543331",
      parentEmail: "akhil.verma@example.com",
      address: "Ahmedabad, Gujarat",
      interestedIn: ["English"],
      preferredBatch: "Grade 12 - English Communication",
      preferredTime: "5:00 PM",
      source: "NEWSPAPER" as const,
      sourceDetail: "Sunday newspaper ad",
      referredBy: null,
      status: "NEW" as const,
      priority: "NORMAL" as const,
      assignedTo: null,
      notes: "Just submitted enquiry.",
    },
    {
      enquiryNumber: "ENQ-2025-010",
      studentName: "Kabir Sinha",
      studentAge: 16,
      studentClass: "Class 11",
      parentName: "Manish Sinha",
      parentPhone: "9876543341",
      parentEmail: "manish.sinha@example.com",
      address: "Mumbai, Maharashtra",
      interestedIn: ["Chemistry"],
      preferredBatch: "Grade 11 - Chemistry",
      preferredTime: "7:30 PM",
      source: "WEBSITE" as const,
      sourceDetail: "Public enquiry form",
      referredBy: null,
      status: "INTERESTED" as const,
      priority: "HIGH" as const,
      assignedTo: "Demo Coordinator",
      notes: "Wants to start next month.",
    },
  ];

  const createdEnquiries = [];
  for (const entry of enquirySeedData) {
    createdEnquiries.push(
      await prisma.enquiry.create({
        data: {
          ...entry,
          studentAge: entry.studentAge ?? null,
          studentClass: entry.studentClass ?? null,
          parentEmail: entry.parentEmail ?? null,
          address: entry.address ?? null,
          preferredBatch: entry.preferredBatch ?? null,
          preferredTime: entry.preferredTime ?? null,
          sourceDetail: entry.sourceDetail ?? null,
          referredBy: entry.referredBy ?? null,
          assignedTo: entry.assignedTo ?? null,
          notes: entry.notes ?? null,
          assignedAt: entry.assignedTo ? new Date() : null,
        },
      })
    );
  }

  await prisma.followUp.createMany({
    data: [
      {
        enquiryId: createdEnquiries[0].id,
        type: "CALL",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: "PENDING",
        notes: "Call parent about batch timing.",
        doneBy: adminUser!.id,
      },
      {
        enquiryId: createdEnquiries[1].id,
        type: "WHATSAPP",
        scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        status: "COMPLETED",
        notes: "Shared brochure and fee sheet.",
        outcome: "Parent will revisit this week.",
        doneBy: adminUser!.id,
      },
      {
        enquiryId: createdEnquiries[4].id,
        type: "DEMO",
        scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48),
        status: "PENDING",
        notes: "Schedule demo for science classes.",
        doneBy: adminUser!.id,
      },
    ],
  });

  await prisma.demoClass.createMany({
    data: [
      {
        enquiryId: createdEnquiries[2].id,
        batchId: createdBatches[2].id,
        scheduledDate: new Date(2025, 1, 25),
        scheduledTime: "17:00",
        status: "SCHEDULED",
        teacherNotes: "Show chapter walkthrough.",
        interested: true,
      },
      {
        enquiryId: createdEnquiries[3].id,
        batchId: createdBatches[3].id,
        scheduledDate: new Date(2025, 1, 27),
        scheduledTime: "16:30",
        status: "COMPLETED",
        teacherNotes: "Excellent participation.",
        parentFeedback: "Loved the trial class.",
        interested: true,
      },
    ],
  });

  const convertedTargets = [
    { enquiry: createdEnquiries[3], student: createdStudents[0], batch: createdBatches[3] },
    { enquiry: createdEnquiries[4], student: createdStudents[1], batch: createdBatches[0] },
  ];

  for (const target of convertedTargets) {
    await prisma.enquiry.update({
      where: { id: target.enquiry.id },
      data: {
        isConverted: true,
        convertedAt: new Date(),
        status: "CONVERTED",
        studentId: target.student.id,
      },
    });
  }

  console.log(`✓ Seeded ${createdEnquiries.length} enquiries, follow-ups, demo classes, and converted leads`);

  const adminForLogs = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (adminForLogs) {
    const { seedActivityLogs } = await import("./seedActivityLogs");
    await seedActivityLogs(
      prisma,
      { id: adminForLogs.id, name: adminForLogs.name, role: adminForLogs.role },
      []
    );
  }

  await backfillSeedInstitute(institute.id);
  console.log(`Seed data assigned to institute ${institute.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
