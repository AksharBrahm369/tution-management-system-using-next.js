import StudentProfilePage from "@/components/admin/students/StudentProfile/StudentProfilePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentProfilePage studentId={id} />;
}
