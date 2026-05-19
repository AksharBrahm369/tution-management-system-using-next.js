import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ParentResultsPage from "@/components/parent/exams/ParentResultsPage";

export default async function ParentExamsRoutePage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "PARENT") redirect("/login");

  const parent = await prisma.parent.findFirst({
    where: { userId: session.userId },
    include: { students: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!parent || parent.students.length === 0) {
    return <ParentResultsPage rows={[]} />;
  }

  const studentIds = parent.students.map((student) => student.id);
  const studentNameMap = new Map(parent.students.map((student) => [student.id, `${student.firstName} ${student.lastName}`]));

  const results = await prisma.examResult.findMany({
    where: {
      studentId: { in: studentIds },
      exam: { isResultPublished: true },
    },
    include: {
      exam: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ParentResultsPage
      rows={results.map((result) => ({
        examTitle: result.exam.title,
        studentName: studentNameMap.get(result.studentId) ?? "Student",
        marks: result.isAbsent ? "AB" : `${result.marksObtained ?? 0}/${result.totalMarks}`,
        percentage: result.percentage,
        grade: result.grade,
      }))}
    />
  );
}
