import AddStudentPage from "@/components/admin/students/AddStudent/AddStudentPage";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ standardId?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  return <AddStudentPage standardId={params?.standardId} returnHref={params?.returnTo} />;
}
