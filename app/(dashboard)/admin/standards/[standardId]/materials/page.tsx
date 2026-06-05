import { notFound } from "next/navigation";
import MaterialsDashboardPage from "@/components/admin/materials/MaterialsDashboardPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardMaterialsPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  return <MaterialsDashboardPage standardId={standard.id} standardName={standard.name} basePath={`/admin/standards/${standard.id}/materials`} />;
}
