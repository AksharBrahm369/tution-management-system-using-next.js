export default function UpcomingExamsSection({ exams }: { exams: Array<{ id: string; title: string; examDate: string; subject: string; totalMarks: number }> }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Upcoming Exams</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {exams.map((exam) => (
          <div key={exam.id} className="rounded-xl border p-4 dark:border-slate-700">
            <p className="font-medium">{exam.title}</p>
            <p className="text-sm text-slate-500">{new Date(exam.examDate).toLocaleString()}</p>
            <p className="text-sm">{exam.subject} | Total: {exam.totalMarks}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
