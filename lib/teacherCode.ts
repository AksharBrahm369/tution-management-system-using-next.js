import { prisma } from "@/lib/prisma";

export async function generateTeacherCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TCH-${year}-`;

  const lastTeacher = await prisma.teacher.findFirst({
    where: {
      teacherCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      teacherCode: "desc",
    },
  });

  if (!lastTeacher) {
    return `${prefix}001`;
  }

  const lastSequence = parseInt(lastTeacher.teacherCode.split("-").pop() || "0", 10);
  const nextSequence = String(lastSequence + 1).padStart(3, "0");

  return `${prefix}${nextSequence}`;
}
