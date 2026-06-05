import { notFound } from "next/navigation";
import ExamListPage from "@/components/admin/exams/ExamList/ExamListPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardExamsPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  return <ExamListPage standardId={standard.id} standardName={standard.name} basePath={`/admin/standards/${standard.id}/exams`} />;
}
