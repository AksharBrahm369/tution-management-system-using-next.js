import EnquiryForm from "@/components/public/EnquiryForm";

export default function Page() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.15),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <EnquiryForm />
    </main>
  );
}
