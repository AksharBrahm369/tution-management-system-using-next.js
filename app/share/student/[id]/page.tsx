import StudentShareView from "@/components/public/StudentShareView";
import { getPublicStudentProfile } from "@/lib/publicStudentProfile";
import { resolvePublicInstituteId } from "@/lib/instituteProvisioning";
import { withRequestInstitute, withoutAuthScope } from "@/lib/institute";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // In multi-tenant database, lookup the student's instituteId first
  const studentInfo = await withoutAuthScope(() =>
    prisma.student.findUnique({
      where: { id },
      select: { instituteId: true }
    })
  );

  let instituteId = studentInfo?.instituteId;
  if (!instituteId) {
    instituteId = await resolvePublicInstituteId();
  }

  const initialData = instituteId
    ? await withRequestInstitute(instituteId, () => getPublicStudentProfile(id))
    : null;

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  return <StudentShareView studentId={id} initialData={initialData} baseUrl={baseUrl} />;
}
