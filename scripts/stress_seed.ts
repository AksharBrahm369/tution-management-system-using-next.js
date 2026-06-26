import "dotenv/config";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Helper to generate unique cuid-like IDs
function uuid() {
  return "str-" + Math.random().toString(36).slice(2, 15) + Date.now().toString(36);
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } }) : new Pool();
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const SEED_INSTITUTE_ID = "cmqunr0lt000104jv3vprrtgn";

async function main() {
  console.log("🚀 Starting database stress loading...");

  // Clean up existing records for target institute to avoid constraint violations
  console.log("Cleaning up existing records...");
  await prisma.batchEnrollment.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });
  await prisma.student.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });
  await prisma.parent.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });
  await prisma.batch.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });
  await prisma.teacherSubject.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });
  await prisma.teacher.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });
  await prisma.subject.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });
  await prisma.standard.deleteMany({ where: { instituteId: SEED_INSTITUTE_ID } });

  // 1. Ensure seed institute exists
  console.log("Checking seed institute...");
  const inst = await prisma.institute.findUnique({ where: { id: SEED_INSTITUTE_ID } });
  if (!inst) {
    throw new Error(`Institute with ID ${SEED_INSTITUTE_ID} not found in database!`);
  }

  // 2. Generate 5 Super Admin users
  console.log("Generating 5 Admin logins...");
  const passwordHash = await bcryptjs.hash("Darshan@369", 12);
  const adminUsers = [];
  for (let i = 1; i <= 5; i++) {
    adminUsers.push({
      id: `admin-usr-${i}`,
      instituteId: SEED_INSTITUTE_ID,
      name: `Stress Admin ${i}`,
      email: `admin${i}@tuitionpro.test`,
      password: passwordHash,
      role: "SUPER_ADMIN" as const,
      isActive: true,
      isVerified: true,
    });
  }

  // Insert admins using upsert loops or simple check-and-create
  for (const admin of adminUsers) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: { name: admin.name, password: admin.password, instituteId: SEED_INSTITUTE_ID },
      create: admin,
    });
  }

  // 3. Seed 10 Standards
  console.log("Seeding standards...");
  const standardsData = [];
  for (let i = 1; i <= 10; i++) {
    standardsData.push({
      id: `std-stress-${i}-${uuid().slice(-8)}`,
      instituteId: SEED_INSTITUTE_ID,
      name: `Standard ${i}`,
      order: i,
      isActive: true,
    });
  }
  for (const std of standardsData) {
    await prisma.standard.create({
      data: std,
    });
  }

  // 4. Seed 10 Subjects
  console.log("Seeding subjects...");
  const subjectsData = [
    { id: `sub-stress-1-${uuid().slice(-8)}`, name: "Mathematics", code: "MATH" },
    { id: `sub-stress-2-${uuid().slice(-8)}`, name: "Physics", code: "PHY" },
    { id: `sub-stress-3-${uuid().slice(-8)}`, name: "Chemistry", code: "CHEM" },
    { id: `sub-stress-4-${uuid().slice(-8)}`, name: "Biology", code: "BIO" },
    { id: `sub-stress-5-${uuid().slice(-8)}`, name: "English", code: "ENG" },
    { id: `sub-stress-6-${uuid().slice(-8)}`, name: "Social Science", code: "SS" },
    { id: `sub-stress-7-${uuid().slice(-8)}`, name: "History", code: "HIST" },
    { id: `sub-stress-8-${uuid().slice(-8)}`, name: "Geography", code: "GEO" },
    { id: `sub-stress-9-${uuid().slice(-8)}`, name: "Computer Science", code: "CS" },
    { id: `sub-stress-10-${uuid().slice(-8)}`, name: "Commerce", code: "COMM" },
  ];
  for (const sub of subjectsData) {
    await prisma.subject.create({
      data: { ...sub, instituteId: SEED_INSTITUTE_ID },
    });
  }

  // 5. Generate 1000 Teachers
  console.log("Generating 1000 teachers...");
  const teachers = [];
  const teacherIds = [];
  const teacherSubjects = [];

  for (let i = 1; i <= 1000; i++) {
    const teacherId = `tch-${i}-${uuid().slice(-8)}`;
    teacherIds.push(teacherId);
    teachers.push({
      id: teacherId,
      instituteId: SEED_INSTITUTE_ID,
      teacherCode: `TCH-STRESS-${String(i).padStart(4, "0")}`,
      firstName: `TeacherName${i}`,
      lastName: `LastName${i}`,
      email: `teacher${i}@tuitionpro.test`,
      phone: `98000${String(100000 + i).slice(-5)}`,
      gender: i % 2 === 0 ? ("FEMALE" as const) : ("MALE" as const),
      employmentType: "FULL_TIME" as const,
      salaryType: "FIXED" as const,
      fixedSalary: 25000 + (i % 10) * 1000,
      status: "ACTIVE" as const,
      joiningDate: new Date(),
    });

    // Map each teacher to a primary subject
    teacherSubjects.push({
      id: uuid(),
      instituteId: SEED_INSTITUTE_ID,
      teacherId,
      subjectId: subjectsData[i % subjectsData.length].id,
      isPrimary: true,
    });
  }

  // Bulk insert teachers and their subjects mapping
  await prisma.teacher.createMany({ data: teachers, skipDuplicates: true });
  await prisma.teacherSubject.createMany({ data: teacherSubjects, skipDuplicates: true });

  // 6. Generate 1000 Batches
  console.log("Generating 1000 batches...");
  const batches = [];
  const batchIds = [];
  for (let i = 1; i <= 1000; i++) {
    const batchId = `bch-${i}-${uuid().slice(-8)}`;
    batchIds.push(batchId);
    batches.push({
      id: batchId,
      instituteId: SEED_INSTITUTE_ID,
      name: `Batch Grade ${10 - (i % 5)} - Group ${i}`,
      code: `BCH-STRESS-${String(i).padStart(4, "0")}`,
      subjectId: subjectsData[i % subjectsData.length].id,
      teacherId: teacherIds[i % teacherIds.length],
      standardId: standardsData[i % standardsData.length].id,
      days: ["MONDAY", "WEDNESDAY", "FRIDAY"] as any,
      startTime: "16:00",
      endTime: "17:30",
      durationMinutes: 90,
      maxStrength: 30,
      academicYear: "2025-26",
      startDate: new Date(2025, 0, 1),
      fees: 1000 + (i % 5) * 200,
      status: "ACTIVE" as const,
      color: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"][i % 5],
    });
  }
  await prisma.batch.createMany({ data: batches, skipDuplicates: true });

  // 7. Generate 1000 Parents
  console.log("Generating 1000 parents...");
  const parents = [];
  const parentIds = [];
  for (let i = 1; i <= 1000; i++) {
    const parentId = `prt-${i}-${uuid().slice(-8)}`;
    parentIds.push(parentId);
    parents.push({
      id: parentId,
      instituteId: SEED_INSTITUTE_ID,
      parentCode: `PRT-STRESS-${String(i).padStart(4, "0")}`,
      fatherName: `FatherName${i} LastName${i}`,
      fatherPhone: `97000${String(100000 + i).slice(-5)}`,
      fatherEmail: `father${i}@tuitionpro.test`,
      fatherOccup: "Service",
      motherName: `MotherName${i} LastName${i}`,
      motherPhone: `96000${String(100000 + i).slice(-5)}`,
      motherEmail: `mother${i}@tuitionpro.test`,
      motherOccup: "Homemaker",
      primaryContact: "FATHER",
    });
  }
  await prisma.parent.createMany({ data: parents, skipDuplicates: true });

  // 8. Generate 1000 Students
  console.log("Generating 1000 students...");
  const students = [];
  const studentIds = [];
  for (let i = 1; i <= 1000; i++) {
    const studentId = `stu-${i}-${uuid().slice(-8)}`;
    studentIds.push(studentId);
    students.push({
      id: studentId,
      instituteId: SEED_INSTITUTE_ID,
      studentCode: `STU-STRESS-${String(i).padStart(4, "0")}`,
      firstName: `StudentName${i}`,
      lastName: `LastName${i}`,
      email: `student${i}@tuitionpro.test`,
      phone: `95000${String(100000 + i).slice(-5)}`,
      dateOfBirth: new Date(2010 - (i % 5), i % 12, 15),
      gender: i % 2 === 0 ? ("FEMALE" as const) : ("MALE" as const),
      city: "Mumbai",
      state: "Maharashtra",
      joiningDate: new Date(),
      academicYear: "2025-26",
      status: "ACTIVE" as const,
      category: ["GOOD", "TOPPER", "AVERAGE", "WEAK"][i % 4] as any,
      parentId: parentIds[i % parentIds.length],
      standardId: standardsData[i % standardsData.length].id,
    });
  }
  await prisma.student.createMany({ data: students, skipDuplicates: true });

  // 9. Generate 1000 BatchEnrollments
  console.log("Generating 1000 batch enrollments...");
  const enrollments = [];
  for (let i = 0; i < 1000; i++) {
    enrollments.push({
      id: uuid(),
      instituteId: SEED_INSTITUTE_ID,
      batchId: batchIds[i % batchIds.length],
      studentId: studentIds[i],
      enrollDate: new Date(),
      enrolledBy: "stress_test_script",
      isActive: true,
    });
  }
  await prisma.batchEnrollment.createMany({ data: enrollments, skipDuplicates: true });

  console.log("🎉 Seeding complete!");
  console.log(`- 5 Super Admin Logins (Emails admin1@tuitionpro.test through admin5@tuitionpro.test, Password: Darshan@369)`);
  console.log(`- 10 Standards`);
  console.log(`- 10 Subjects`);
  console.log(`- 1000 Teachers`);
  console.log(`- 1000 Batches`);
  console.log(`- 1000 Parents`);
  console.log(`- 1000 Students`);
  console.log(`- 1000 Batch Enrollments`);
}

main()
  .catch((e) => {
    console.error("❌ Error during stress seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
