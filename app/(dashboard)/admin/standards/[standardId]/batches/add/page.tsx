export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import CreateBatchPage from "@/components/admin/batches/CreateBatch/CreateBatchPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardCreateBatchPage({
  params,
}: {
  params: Promise<{ standardId: string }>;
}) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);

  if (!standard) notFound();

  return (
    <CreateBatchPage
      standardId={standard.id}
      returnHref={`/admin/standards/${standard.id}/batches`}
    />
  );
}
