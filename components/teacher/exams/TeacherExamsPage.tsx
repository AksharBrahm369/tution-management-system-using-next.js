import UpcomingExamCards from "./UpcomingExamCards";
import PendingMarksSection from "./PendingMarksSection";
import TeacherMarksEntry from "./TeacherMarksEntry";

type TeacherExam = {
  id: string;
  title: string;
  examDate: string;
  batchName: string;
  status: string;
};

export default function TeacherExamsPage({ exams }: { exams: TeacherExam[] }) {
  const upcoming = exams.filter((exam) => ["UPCOMING", "ONGOING"].includes(exam.status));
  const pending = exams.filter((exam) => exam.status === "RESULT_PENDING");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">My Exams</h1>
      <PendingMarksSection exams={pending.map((item) => ({ id: item.id, title: item.title, batchName: item.batchName }))} />
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Upcoming Exams</h2>
        <UpcomingExamCards exams={upcoming.map((item) => ({ id: item.id, title: item.title, examDate: item.examDate, batchName: item.batchName }))} />
      </section>
      <TeacherMarksEntry />
    </div>
  );
}
