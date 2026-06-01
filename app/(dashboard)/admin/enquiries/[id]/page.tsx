import { Suspense } from "react";
import EnquiryDetailPage from "@/components/admin/enquiries/EnquiryDetail/EnquiryDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>}>
      <EnquiryDetailPage enquiryId={id} />
    </Suspense>
  );
}
