export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import StudentProfilePage from "@/components/admin/students/StudentProfile/StudentProfilePage";
import { getStandardById } from "@/lib/standards";

export default async function StandardStudentProfilePage({ params }: { params: Promise<{ standardId: string; id: string }> }) {
  const { standardId, id } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return <StudentProfilePage studentId={id} basePath={`/admin/standards/${standard.id}/students`} />;
}
