export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { notFound } from "next/navigation";
import MarkAttendancePage from "@/components/admin/attendance/Mark/MarkAttendancePage";
import { getStandardById } from "@/lib/standards";

export default async function StandardMarkAttendanceRoute({
  params,
}: {
  params: Promise<{ standardId: string }>;
}) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>}>
      <MarkAttendancePage
        standardId={standard.id}
        standardName={standard.name}
        basePath={`/admin/standards/${standard.id}/attendance`}
      />
    </Suspense>
  );
}
