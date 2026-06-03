import StudentShareView from "@/components/public/StudentShareView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <StudentShareView studentId={id} />;
}
