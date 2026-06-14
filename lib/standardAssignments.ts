type DbClient = {
  batch: any;
  student: any;
  teacherStandardSubject: any;
};

type StandardBatch = { standardId: string | null };
type StandardStudent = {
  firstName: string;
  lastName: string;
  studentCode: string;
  standardId: string | null;
};

function getDistinctStandardIds(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export async function inferStandardIdFromBatchIds(db: DbClient, batchIds: string[]) {
  if (batchIds.length === 0) {
    return null;
  }

  const batches = await db.batch.findMany({
    where: { id: { in: batchIds } },
    select: { id: true, standardId: true },
  });

  const standardIds = getDistinctStandardIds(batches.map((batch: StandardBatch) => batch.standardId));
  if (standardIds.length > 1) {
    throw new Error("Selected batches belong to multiple standards. Please select batches from only one standard.");
  }

  return standardIds[0] ?? null;
}

export async function validateStudentsForBatchStandard(db: DbClient, studentIds: string[], batchStandardId: string | null) {
  if (!batchStandardId || studentIds.length === 0) {
    return;
  }

  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentCode: true,
      standardId: true,
    },
  });

  const conflicts = students.filter((student: StandardStudent) => student.standardId && student.standardId !== batchStandardId);
  if (conflicts.length > 0) {
    const labels = conflicts.map((student: StandardStudent) => `${student.firstName} ${student.lastName} (${student.studentCode})`).join(", ");
    throw new Error(`These students belong to another standard and cannot be enrolled in this batch: ${labels}`);
  }
}

export async function assignStudentsToBatchStandard(db: DbClient, studentIds: string[], batchStandardId: string | null) {
  if (!batchStandardId || studentIds.length === 0) {
    return;
  }

  await db.student.updateMany({
    where: {
      id: { in: studentIds },
      OR: [{ standardId: null }, { standardId: batchStandardId }],
    },
    data: { standardId: batchStandardId },
  });
}

export async function syncTeacherStandardSubjectForBatch(db: DbClient, batchId: string) {
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: { teacherId: true, subjectId: true, standardId: true },
  });

  if (!batch?.standardId) {
    return;
  }

  await db.teacherStandardSubject.upsert({
    where: {
      teacherId_standardId_subjectId: {
        teacherId: batch.teacherId,
        standardId: batch.standardId,
        subjectId: batch.subjectId,
      },
    },
    create: {
      teacherId: batch.teacherId,
      standardId: batch.standardId,
      subjectId: batch.subjectId,
    },
    update: {},
  });
}
