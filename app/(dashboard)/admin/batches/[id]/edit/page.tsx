import EditBatchPage from "@/components/admin/batches/BatchDetail/EditBatchPage";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Edit Batch | TuitionPro Admin",
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <EditBatchPage batchId={id} />;
}
