import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type StudentCodeClient = {
  $executeRaw(query: Prisma.Sql): Promise<number>;
  $queryRaw<T = unknown>(query: Prisma.Sql): Promise<T>;
};

function formatStudentCode(year: number, sequence: number): string {
  return `STU-${year}-${String(sequence).padStart(3, "0")}`;
}

export async function generateNextStudentCode(): Promise<string> {
  return prisma.$transaction((tx) => generateNextStudentCodeInTransaction(tx));
}

export async function generateNextStudentCodeInTransaction(client: StudentCodeClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const codePrefix = `STU-${currentYear}-%`;
  const emailPrefix = `stu-${currentYear}-%@tuitionpro.local`;
  const codePattern = `^STU-${currentYear}-(\\d+)$`;

  await client.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(915273)`);

  const rows = await client.$queryRaw<Array<{ sequence: number | bigint | null }>>(Prisma.sql`
    SELECT MAX(sequence) AS sequence
    FROM (
      SELECT CAST(substring("studentCode" FROM ${codePattern}) AS integer) AS sequence
      FROM "students"
      WHERE "studentCode" LIKE ${codePrefix}
      UNION ALL
      SELECT CAST(substring(upper(split_part("email", '@', 1)) FROM ${codePattern}) AS integer) AS sequence
      FROM "users"
      WHERE lower("email") LIKE ${emailPrefix}
    ) existing_codes
    WHERE sequence IS NOT NULL
  `);

  const lastSequence = rows[0]?.sequence;
  if (lastSequence === null || lastSequence === undefined) {
    return formatStudentCode(currentYear, 1);
  }

  return formatStudentCode(currentYear, Number(lastSequence) + 1);
}

export function studentNameToInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}
