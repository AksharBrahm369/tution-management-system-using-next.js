import StudentShareView from "@/components/public/StudentShareView";
import { getPublicStudentProfile } from "@/lib/publicStudentProfile";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const initialData = await getPublicStudentProfile(id);

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  return <StudentShareView studentId={id} initialData={initialData} baseUrl={baseUrl} />;
}
