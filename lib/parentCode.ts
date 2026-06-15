import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ParentCodeClient = {
  $executeRaw(query: Prisma.Sql): Promise<number>;
  $queryRaw<T = unknown>(query: Prisma.Sql): Promise<T>;
};

function formatParentCode(year: number, sequence: number): string {
  return `PAR-${year}-${String(sequence).padStart(3, "0")}`;
}

export async function generateNextParentCode(): Promise<string> {
  return prisma.$transaction((tx) => generateNextParentCodeInTransaction(tx));
}

export async function generateNextParentCodeInTransaction(client: ParentCodeClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const codePrefix = `PAR-${currentYear}-%`;
  const emailPrefix = `par-${currentYear}-%@tuitionpro.local`;
  const codePattern = `^PAR-${currentYear}-(\\d+)$`;

  // Different lock ID from studentCode (915273)
  await client.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(915274)`);

  const rows = await client.$queryRaw<Array<{ sequence: number | bigint | null }>>(Prisma.sql`
    SELECT MAX(sequence) AS sequence
    FROM (
      SELECT CAST(substring("parentCode" FROM ${codePattern}) AS integer) AS sequence
      FROM "parents"
      WHERE "parentCode" LIKE ${codePrefix}
      UNION ALL
      SELECT CAST(substring(upper(split_part("email", '@', 1)) FROM ${codePattern}) AS integer) AS sequence
      FROM "users"
      WHERE lower("email") LIKE ${emailPrefix}
    ) existing_codes
    WHERE sequence IS NOT NULL
  `);

  const lastSequence = rows[0]?.sequence;
  if (lastSequence === null || lastSequence === undefined) {
    return formatParentCode(currentYear, 1);
  }

  return formatParentCode(currentYear, Number(lastSequence) + 1);
}
