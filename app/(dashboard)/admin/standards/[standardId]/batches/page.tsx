import { notFound } from "next/navigation";
import BatchListPage from "@/components/admin/batches/BatchList/BatchListPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardBatchesPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  return <BatchListPage standardId={standard.id} standardName={standard.name} basePath={`/admin/standards/${standard.id}/batches`} />;
}
