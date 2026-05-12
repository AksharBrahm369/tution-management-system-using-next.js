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

const batches = [
  {
    batchCode: "BAT-001",
    name: "Grade 10 - Math",
    subject: "Mathematics",
    teacherName: "Mr. Sharma",
    schedule: "Mon, Wed, Fri - 4:00 PM",
    academicYear: "2025-26",
  },
  {
    batchCode: "BAT-002",
    name: "Grade 9 - Science",
    subject: "Science",
    teacherName: "Dr. Kumar",
    schedule: "Tue, Thu, Sat - 5:00 PM",
    academicYear: "2025-26",
  },
];

const students: SeedStudent[] = [
  { code: "STU-2025-001", firstName: "Aarav", lastName: "Shah", gender: "MALE", phone: "9876543210", city: "Mumbai", fatherName: "Rajesh Shah", fatherPhone: "9876543211", status: "ACTIVE", category: "GOOD" },
  { code: "STU-2025-002", firstName: "Priya", lastName: "Patel", gender: "FEMALE", phone: "9876543220", city: "Mumbai", fatherName: "Suresh Patel", fatherPhone: "9876543221", status: "ACTIVE", category: "TOPPER" },
  { code: "STU-2025-003", firstName: "Darshan", lastName: "Zala", gender: "MALE", phone: "9876543230", city: "Ahmedabad", fatherName: "Mahesh Zala", fatherPhone: "9876543231", status: "ACTIVE", category: "GOOD" },
  { code: "STU-2025-004", firstName: "Kiara", lastName: "Shah", gender: "FEMALE", phone: "9876543240", city: "Surat", fatherName: "Anil Shah", fatherPhone: "9876543241", status: "ON_LEAVE", category: "AVERAGE" },
  { code: "STU-2025-005", firstName: "Vihaan", lastName: "Mehta", gender: "MALE", phone: "9876543250", city: "Rajkot", fatherName: "Nilesh Mehta", fatherPhone: "9876543251", status: "SUSPENDED", category: "WEAK" },
  { code: "STU-2025-006", firstName: "Anaya", lastName: "Joshi", gender: "FEMALE", phone: "9876543260", city: "Vadodara", fatherName: "Rakesh Joshi", fatherPhone: "9876543261", status: "ACTIVE", category: "TOPPER" },
  { code: "STU-2025-007", firstName: "Reyansh", lastName: "Desai", gender: "MALE", phone: "9876543270", city: "Jamnagar", fatherName: "Bhavesh Desai", fatherPhone: "9876543271", status: "GRADUATED", category: "GOOD" },
  { code: "STU-2025-008", firstName: "Ishita", lastName: "Thakkar", gender: "FEMALE", phone: "9876543280", city: "Bhavnagar", fatherName: "Tushar Thakkar", fatherPhone: "9876543281", status: "INACTIVE", category: "AVERAGE" },
  { code: "STU-2025-009", firstName: "Kabir", lastName: "Vora", gender: "MALE", phone: "9876543290", city: "Junagadh", fatherName: "Pankaj Vora", fatherPhone: "9876543291", status: "TRANSFERRED", category: "GOOD" },
  { code: "STU-2025-010", firstName: "Meera", lastName: "Rana", gender: "FEMALE", phone: "9876543300", city: "Gandhinagar", fatherName: "Hitesh Rana", fatherPhone: "9876543301", status: "ACTIVE", category: "TOPPER" },
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

  await prisma.studentActivity.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.batchEnrollment.deleteMany();
  await prisma.siblingLink.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.medicalInfo.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.batch.deleteMany();

  const createdBatches = await Promise.all(batches.map((batch) => prisma.batch.create({ data: batch })));
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
        activities: {
          create: {
            type: "ENROLLED",
            title: "Student enrolled",
            description: `${student.firstName} ${student.lastName} was added to TuitionPro.`,
          },
        },
        batchEnrollments: {
          create: {
            batchId: createdBatches[index % createdBatches.length].id,
            joinDate: new Date(),
          },
        },
      },
    });

    createdStudents.push(createdStudent);
  }

  await prisma.siblingLink.create({
    data: {
      studentId: createdStudents[0].id,
      siblingId: createdStudents[1].id,
    },
  });

  await prisma.medicalInfo.create({
    data: {
      studentId: createdStudents[0].id,
      allergies: "Peanuts",
      medications: "None",
      conditions: "None",
      doctorName: "Dr. Mehta",
      doctorPhone: "9876500000",
      insuranceInfo: "Standard Health Insurance",
      extraNotes: "Uses spectacles during study hours.",
    },
  });

  await prisma.studentDocument.create({
    data: {
      studentId: createdStudents[0].id,
      name: "Birth Certificate",
      type: "BIRTH_CERTIFICATE",
      fileUrl: "https://example.com/birth-certificate.pdf",
      fileSize: "1.2 MB",
    },
  });

  console.log(`Seeded ${createdStudents.length} students and ${createdBatches.length} batches.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });