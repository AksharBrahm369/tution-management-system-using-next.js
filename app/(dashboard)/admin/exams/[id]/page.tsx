import { notFound } from "next/navigation";
import ExamDetailPage from "@/components/admin/exams/ExamDetail/ExamDetailPage";
import { getExamDetail } from "@/lib/examService";

export const dynamic = "force-dynamic";

export default async function AdminExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await getExamDetail(id);
  
  if (!exam) return notFound();

  // Convert dates and nulls to avoid Server Component serialization issues
  const safeExam = JSON.parse(JSON.stringify(exam));

  return <ExamDetailPage exam={safeExam} />;
}
