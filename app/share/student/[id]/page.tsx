import StudentShareView from "@/components/public/StudentShareView";
import { getPublicStudentProfile } from "@/lib/publicStudentProfile";
import { resolvePublicInstituteId } from "@/lib/instituteProvisioning";
import { withRequestInstitute, withoutAuthScope } from "@/lib/institute";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  let initialData = null;

  try {
    // In multi-tenant database, lookup the student's instituteId first
    const studentInfo = await withoutAuthScope(() =>
      prisma.student.findUnique({
        where: { id },
        select: { instituteId: true },
      })
    );

    let instituteId = studentInfo?.instituteId;
    if (!instituteId) {
      instituteId = await resolvePublicInstituteId();
    }

    const initialDataRaw = instituteId
      ? await withRequestInstitute(instituteId, () => getPublicStudentProfile(id))
      : null;

    // Serialize dates to strings so they pass as props to client components
    initialData = initialDataRaw ? JSON.parse(JSON.stringify(initialDataRaw)) : null;
  } catch (err) {
    // If server-side fetch fails (e.g. DB not reachable), fall back to
    // client-side fetch inside StudentShareView
    console.error("[share/student] Server-side prefetch failed:", err);
    initialData = null;
  }

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  return <StudentShareView studentId={id} initialData={initialData} baseUrl={baseUrl} />;
}
