import EnquiryDetailPage from "@/components/admin/enquiries/EnquiryDetail/EnquiryDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EnquiryDetailPage enquiryId={id} />;
}
