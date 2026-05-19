import { ExamItem } from "../types";
import StudentWiseResults from "./StudentWiseResults";
import BatchWiseResults from "./BatchWiseResults";

export default function AllResultsPage({ exams }: { exams: ExamItem[] }) {
  const allResults = exams.flatMap((exam) => exam.results);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">All Results</h1>
        <p className="text-sm text-slate-500">Central result view across all exams.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Student Wise</h2>
        <StudentWiseResults results={allResults} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Batch Wise</h2>
        <BatchWiseResults exams={exams} />
      </section>
    </div>
  );
}
