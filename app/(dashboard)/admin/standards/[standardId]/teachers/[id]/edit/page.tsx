export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import EditTeacherPage from "@/components/admin/teachers/EditTeacher/EditTeacherPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardEditTeacherPage({ params }: { params: Promise<{ standardId: string; id: string }> }) {
  const { standardId, id } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return <EditTeacherPage teacherId={id} standardId={standard.id} basePath={`/admin/standards/${standard.id}/teachers`} />;
}
