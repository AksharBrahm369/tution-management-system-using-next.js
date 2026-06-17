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
    `ALTER TABLE "academic_years" DROP CONSTRAINT IF EXISTS "academic_years_name_key" CASCADE`,
    `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_studentCode_key" CASCADE`,
    `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_email_key" CASCADE`,
    `ALTER TABLE "standards" DROP CONSTRAINT IF EXISTS "standards_name_key" CASCADE`,
    `ALTER TABLE "standards" DROP CONSTRAINT IF EXISTS "standards_order_key" CASCADE`,
    `ALTER TABLE "parents" DROP CONSTRAINT IF EXISTS "parents_parentCode_key" CASCADE`,
    `ALTER TABLE "enquiries" DROP CONSTRAINT IF EXISTS "enquiries_enquiryNumber_key" CASCADE`,
    `ALTER TABLE "fee_records" DROP CONSTRAINT IF EXISTS "fee_records_receiptNumber_key" CASCADE`,
    `ALTER TABLE "fee_payments" DROP CONSTRAINT IF EXISTS "fee_payments_paymentNumber_key" CASCADE`,
    `ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "exams_code_key" CASCADE`,
    `ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "teachers_teacherCode_key" CASCADE`,
    `ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "teachers_email_key" CASCADE`,
    `ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "subjects_code_key" CASCADE`,
    `ALTER TABLE "rooms" DROP CONSTRAINT IF EXISTS "rooms_code_key" CASCADE`,
    `ALTER TABLE "batches" DROP CONSTRAINT IF EXISTS "batches_code_key" CASCADE`,

    `DROP INDEX IF EXISTS "academic_years_name_key" CASCADE`,
    `DROP INDEX IF EXISTS "students_studentCode_key" CASCADE`,
    `DROP INDEX IF EXISTS "students_email_key" CASCADE`,
    `DROP INDEX IF EXISTS "standards_name_key" CASCADE`,
    `DROP INDEX IF EXISTS "standards_order_key" CASCADE`,
    `DROP INDEX IF EXISTS "parents_parentCode_key" CASCADE`,
    `DROP INDEX IF EXISTS "enquiries_enquiryNumber_key" CASCADE`,
    `DROP INDEX IF EXISTS "fee_records_receiptNumber_key" CASCADE`,
    `DROP INDEX IF EXISTS "fee_payments_paymentNumber_key" CASCADE`,
    `DROP INDEX IF EXISTS "exams_code_key" CASCADE`,
    `DROP INDEX IF EXISTS "teachers_teacherCode_key" CASCADE`,
    `DROP INDEX IF EXISTS "teachers_email_key" CASCADE`,
    `DROP INDEX IF EXISTS "subjects_code_key" CASCADE`,
    `DROP INDEX IF EXISTS "rooms_code_key" CASCADE`,
    `DROP INDEX IF EXISTS "batches_code_key" CASCADE`,
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
