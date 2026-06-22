export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import StudentListPage from "@/components/admin/students/StudentList/StudentListPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardStudentsPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  return <StudentListPage standardId={standard.id} standardName={standard.name} basePath={`/admin/standards/${standard.id}/students`} />;
}
