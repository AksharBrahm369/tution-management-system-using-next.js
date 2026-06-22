export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import TeacherProfilePage from "@/components/admin/teachers/TeacherProfile/TeacherProfilePage";
import { getStandardById } from "@/lib/standards";

export default async function StandardTeacherProfilePage({ params }: { params: Promise<{ standardId: string; id: string }> }) {
  const { standardId, id } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return <TeacherProfilePage teacherId={id} basePath={`/admin/standards/${standard.id}/teachers`} />;
}
