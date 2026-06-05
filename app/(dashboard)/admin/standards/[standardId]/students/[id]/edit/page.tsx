import { notFound } from "next/navigation";
import AddStudentPage from "@/components/admin/students/AddStudent/AddStudentPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardEditStudentPage({ params }: { params: Promise<{ standardId: string; id: string }> }) {
  const { standardId, id } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return (
    <AddStudentPage
      studentId={id}
      standardId={standard.id}
      returnHref={`/admin/standards/${standard.id}/students/${id}`}
    />
  );
}
