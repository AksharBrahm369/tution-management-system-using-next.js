import CreateBatchPage from "@/components/admin/batches/CreateBatch/CreateBatchPage";

export const metadata = {
  title: "Create Batch | TuitionPro Admin",
  description: "Create a new tuition batch",
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ standardId?: string; returnTo?: string }>;
}) {
  const params = await searchParams;
  return <CreateBatchPage standardId={params?.standardId} returnHref={params?.returnTo} />;
}
