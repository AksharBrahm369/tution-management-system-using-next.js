import { notFound } from "next/navigation";
import ExamDetailPage from "@/components/admin/exams/ExamDetail/ExamDetailPage";
import { getExamDetail } from "@/lib/examService";
import { getStandardById } from "@/lib/standards";

export const dynamic = "force-dynamic";

export default async function StandardExamDetailPage({
  params,
}: {
  params: Promise<{ standardId: string; id: string }>;
}) {
  const { standardId, id } = await params;
  const [standard, exam] = await Promise.all([getStandardById(standardId), getExamDetail(id)]);

  if (!standard || !exam) return notFound();

  const safeExam = JSON.parse(JSON.stringify(exam));

  return <ExamDetailPage exam={safeExam} basePath={`/admin/standards/${standard.id}/exams`} />;
}
