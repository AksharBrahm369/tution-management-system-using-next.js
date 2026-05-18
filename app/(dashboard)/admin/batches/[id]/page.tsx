import BatchDetailPage from "@/components/admin/batches/BatchDetail/BatchDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Batch Details | TuitionPro Admin",
};

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <BatchDetailPage batchId={id} />;
}
