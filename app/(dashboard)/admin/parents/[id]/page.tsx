import ParentProfilePage from "@/components/admin/parents/ParentProfile/ParentProfilePage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ParentProfilePage parentId={id} />;
}
