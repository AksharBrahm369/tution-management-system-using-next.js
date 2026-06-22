export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import BatchDetailPage from "@/components/admin/batches/BatchDetail/BatchDetailPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardBatchDetailPage({ params }: { params: Promise<{ standardId: string; id: string }> }) {
  const { standardId, id } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return <BatchDetailPage batchId={id} basePath={`/admin/standards/${standard.id}/batches`} />;
}
