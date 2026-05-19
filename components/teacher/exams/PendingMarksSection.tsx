import Link from "next/link";

export default function PendingMarksSection({ exams }: { exams: Array<{ id: string; title: string; batchName: string }> }) {
  if (exams.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
      <p className="font-medium text-red-700 dark:text-red-300">{exams.length} exams need marks entry</p>
      <div className="mt-2 space-y-1 text-sm">
        {exams.map((exam) => (
          <p key={exam.id}>
            {exam.title} ({exam.batchName}) - <Link href={`/admin/exams/${exam.id}/marks`} className="text-blue-600">Enter Marks</Link>
          </p>
        ))}
      </div>
    </div>
  );
}
