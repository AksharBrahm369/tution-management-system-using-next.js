const pg = require("pg");
const { Client } = pg;
require("dotenv").config();

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to DB.");

  const queries = [
    `ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_instituteId_name_key" UNIQUE ("instituteId", "name")`,
    `ALTER TABLE "students" ADD CONSTRAINT "students_instituteId_studentCode_key" UNIQUE ("instituteId", "studentCode")`,
    `ALTER TABLE "students" ADD CONSTRAINT "students_instituteId_email_key" UNIQUE ("instituteId", "email")`,
    `ALTER TABLE "standards" ADD CONSTRAINT "standards_instituteId_name_key" UNIQUE ("instituteId", "name")`,
    `ALTER TABLE "standards" ADD CONSTRAINT "standards_instituteId_order_key" UNIQUE ("instituteId", "order")`,
    `ALTER TABLE "parents" ADD CONSTRAINT "parents_instituteId_parentCode_key" UNIQUE ("instituteId", "parentCode")`,
    `ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_instituteId_enquiryNumber_key" UNIQUE ("instituteId", "enquiryNumber")`,
    `ALTER TABLE "fee_records" ADD CONSTRAINT "fee_records_instituteId_receiptNumber_key" UNIQUE ("instituteId", "receiptNumber")`,
    `ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_instituteId_paymentNumber_key" UNIQUE ("instituteId", "paymentNumber")`,
    `ALTER TABLE "exams" ADD CONSTRAINT "exams_instituteId_code_key" UNIQUE ("instituteId", "code")`,
    `ALTER TABLE "teachers" ADD CONSTRAINT "teachers_instituteId_teacherCode_key" UNIQUE ("instituteId", "teacherCode")`,
    `ALTER TABLE "teachers" ADD CONSTRAINT "teachers_instituteId_email_key" UNIQUE ("instituteId", "email")`,
    `ALTER TABLE "subjects" ADD CONSTRAINT "subjects_instituteId_code_key" UNIQUE ("instituteId", "code")`,
    `ALTER TABLE "rooms" ADD CONSTRAINT "rooms_instituteId_code_key" UNIQUE ("instituteId", "code")`,
    `ALTER TABLE "batches" ADD CONSTRAINT "batches_instituteId_code_key" UNIQUE ("instituteId", "code")`,
  ];

  for (const query of queries) {
    try {
      console.log(`Executing: ${query}`);
      await client.query(query);
    } catch (err) {
      console.error(`Error executing: ${query}:`, err.message);
    }
  }

  await client.end();
  console.log("Disconnected.");
}

main().catch(console.error);
