import BatchListPage from "@/components/admin/batches/BatchList/BatchListPage";

export const metadata = {
  title: "Batches | TuitionPro Admin",
  description: "Manage all tuition batches and class schedules",
};

export default function Page() {
  return <BatchListPage />;
}
