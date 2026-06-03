import EditTeacherPage from "@/components/admin/teachers/EditTeacher/EditTeacherPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditTeacherPage teacherId={id} />;
}
