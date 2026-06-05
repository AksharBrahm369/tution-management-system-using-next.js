import "dotenv/config";
import pg from "pg";
import { randomUUID } from "crypto";

const { Client } = pg;

type StandardUpdate = {
  id: string;
  code: string;
  label: string;
  fromStandard: string | null;
  toStandard: string;
};

async function loadStudentUpdates(client: pg.Client): Promise<StandardUpdate[]> {
  const { rows } = await client.query<StandardUpdate>(`
    WITH inferred AS (
      SELECT
        s.id,
        s."studentCode" AS code,
        s."firstName" || ' ' || s."lastName" AS label,
        s."standardId" AS "fromStandard",
        MIN(b."standardId") AS "toStandard"
      FROM students s
      JOIN batch_enrollments be
        ON be."studentId" = s.id
       AND be."isActive" = true
      JOIN batches b
        ON b.id = be."batchId"
       AND b."standardId" IS NOT NULL
      GROUP BY s.id, s."studentCode", s."firstName", s."lastName", s."standardId"
      HAVING COUNT(DISTINCT b."standardId") = 1
         AND COALESCE(s."standardId", '') <> MIN(b."standardId")
    )
    SELECT * FROM inferred
    ORDER BY code ASC
  `);
  return rows;
}

async function loadBatchUpdates(client: pg.Client): Promise<StandardUpdate[]> {
  const { rows } = await client.query<StandardUpdate>(`
    WITH student_based AS (
      SELECT
        b.id,
        b.code,
        b.name AS label,
        b."standardId" AS "fromStandard",
        MIN(s."standardId") AS "toStandard",
        1 AS priority
      FROM batches b
      JOIN batch_enrollments be
        ON be."batchId" = b.id
       AND be."isActive" = true
      JOIN students s
        ON s.id = be."studentId"
       AND s."standardId" IS NOT NULL
      GROUP BY b.id, b.code, b.name, b."standardId"
      HAVING COUNT(DISTINCT s."standardId") = 1
         AND COALESCE(b."standardId", '') <> MIN(s."standardId")
    ),
    teacher_based AS (
      SELECT
        b.id,
        b.code,
        b.name AS label,
        b."standardId" AS "fromStandard",
        MIN(other_batches."standardId") AS "toStandard",
        2 AS priority
      FROM batches b
      JOIN batches other_batches
        ON other_batches."teacherId" = b."teacherId"
       AND other_batches.id <> b.id
       AND other_batches."standardId" IS NOT NULL
      WHERE b."standardId" IS NULL
      GROUP BY b.id, b.code, b.name, b."standardId"
      HAVING COUNT(DISTINCT other_batches."standardId") = 1
    ),
    candidates AS (
      SELECT * FROM student_based
      UNION ALL
      SELECT * FROM teacher_based
    ),
    ranked AS (
      SELECT *,
             ROW_NUMBER() OVER (PARTITION BY id ORDER BY priority ASC) AS row_num
      FROM candidates
    )
    SELECT id, code, label, "fromStandard", "toStandard"
    FROM ranked
    WHERE row_num = 1
    ORDER BY code ASC
  `);
  return rows;
}

async function applyUpdates(client: pg.Client, tableName: "students" | "batches", updates: StandardUpdate[]) {
  for (const update of updates) {
    await client.query(`UPDATE ${tableName} SET "standardId" = $1 WHERE id = $2`, [update.toStandard, update.id]);
  }
}

async function syncTeacherStandardSubjects(client: pg.Client) {
  const { rows } = await client.query<{
    teacherId: string;
    standardId: string;
    subjectId: string;
  }>(`
    SELECT DISTINCT b."teacherId" AS "teacherId", b."standardId" AS "standardId", b."subjectId" AS "subjectId"
    FROM batches b
    WHERE b."standardId" IS NOT NULL
  `);

  let inserted = 0;
  for (const row of rows) {
    const result = await client.query(
      `
        INSERT INTO teacher_standard_subjects (id, "teacherId", "standardId", "subjectId", "createdAt")
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT ("teacherId", "standardId", "subjectId") DO NOTHING
      `,
      [randomUUID(), row.teacherId, row.standardId, row.subjectId]
    );
    inserted += result.rowCount ?? 0;
  }

  return inserted;
}

async function main() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query("BEGIN");

    const studentPass1 = await loadStudentUpdates(client);
    await applyUpdates(client, "students", studentPass1);

    const batchPass = await loadBatchUpdates(client);
    await applyUpdates(client, "batches", batchPass);

    const studentPass2 = await loadStudentUpdates(client);
    await applyUpdates(client, "students", studentPass2);

    const syncedTeacherLinks = await syncTeacherStandardSubjects(client);

    await client.query("COMMIT");

    console.log("Standard data repair complete.");
    console.log(`Students updated in pass 1: ${studentPass1.length}`);
    for (const update of studentPass1) {
      console.log(`  student ${update.code} -> ${update.toStandard}`);
    }

    console.log(`Batches updated: ${batchPass.length}`);
    for (const update of batchPass) {
      console.log(`  batch ${update.code} (${update.label}) -> ${update.toStandard}`);
    }

    console.log(`Students updated in pass 2: ${studentPass2.length}`);
    for (const update of studentPass2) {
      console.log(`  student ${update.code} -> ${update.toStandard}`);
    }

    console.log(`Teacher standard-subject links synced: ${syncedTeacherLinks}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Standard data repair failed:", error);
  process.exit(1);
});
