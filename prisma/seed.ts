import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString }) : new Pool();
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type Gender = "MALE" | "FEMALE" | "OTHER";
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

async function ensureAdminUser() {
  const existing = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (existing) return existing;

  const password = await bcryptjs.hash("Aksharbrahm@505", 12);
  return prisma.user.create({
    data: {
      name: "Darshan Zala",
      email: "darshanzala369@gmail.com",
      password,
      role: "SUPER_ADMIN",
      isActive: true,
      isVerified: true,
    },
  });
}

async function main() {
  await ensureAdminUser();

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
  
  // Module 3 cleanup
  await prisma.studentActivity.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.batchEnrollment.deleteMany();
  await prisma.siblingLink.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.medicalInfo.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.room.deleteMany();
  
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });