import Link from "next/link";

export default function UpcomingExamCards({ exams }: { exams: Array<{ id: string; title: string; examDate: string; batchName: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {exams.map((exam) => (
        <div key={exam.id} className="rounded-xl border p-4 dark:border-slate-700">
          <p className="font-medium">{exam.title}</p>
          <p className="text-sm text-slate-500">{exam.batchName} | {new Date(exam.examDate).toLocaleDateString()}</p>
          <Link href={`/admin/exams/${exam.id}/marks`} className="mt-2 inline-block text-sm text-blue-600">Enter Marks</Link>
        </div>
      ))}
    </div>
  );
}
