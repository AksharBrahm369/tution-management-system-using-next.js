import { Suspense } from "react";
import ActivityLogsPage from "@/components/admin/logs/ActivityLogsPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm font-medium">Loading activity logs…</span>
        </div>
      }
    >
      <ActivityLogsPage />
    </Suspense>
  );
}
