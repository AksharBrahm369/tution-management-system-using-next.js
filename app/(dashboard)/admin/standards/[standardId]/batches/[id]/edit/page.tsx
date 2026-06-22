export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import EditBatchPage from "@/components/admin/batches/BatchDetail/EditBatchPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardEditBatchPage({ params }: { params: Promise<{ standardId: string; id: string }> }) {
  const { standardId, id } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  return <EditBatchPage batchId={id} basePath={`/admin/standards/${standard.id}/batches`} />;
}
