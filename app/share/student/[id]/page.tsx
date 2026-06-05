import StudentShareView from "@/components/public/StudentShareView";
import { getPublicStudentProfile } from "@/lib/publicStudentProfile";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const initialData = await getPublicStudentProfile(id);
  return <StudentShareView studentId={id} initialData={initialData} />;
}
