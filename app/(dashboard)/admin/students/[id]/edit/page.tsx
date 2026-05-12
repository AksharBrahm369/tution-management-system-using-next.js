import AddStudentPage from "@/components/admin/students/AddStudent/AddStudentPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AddStudentPage studentId={id} />;
}
