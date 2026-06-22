export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import TeacherListPage from "@/components/admin/teachers/TeacherList/TeacherListPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardTeachersPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  return <TeacherListPage standardId={standard.id} standardName={standard.name} basePath={`/admin/standards/${standard.id}/teachers`} />;
}
