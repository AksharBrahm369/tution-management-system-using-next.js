export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import AddTeacherPage from "@/components/admin/teachers/AddTeacher/AddTeacherPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardAddTeacherPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return (
    <AddTeacherPage
      standardId={standard.id}
      standardName={standard.name}
      returnHref={`/admin/standards/${standard.id}/teachers`}
    />
  );
}
