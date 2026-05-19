import UpcomingExamsSection from "./UpcomingExamsSection";
import MyResultsSection from "./MyResultsSection";
import PerformanceChart from "./PerformanceChart";
import WeakAreasCard from "./WeakAreasCard";

type UpcomingExam = { id: string; title: string; examDate: string; subject: string; totalMarks: number };
type ResultRow = { examId: string; title: string; date: string; marksObtained: number | null; totalMarks: number; percentage: number | null; grade: string | null; rank: number | null };

export default function StudentExamsPage({
  upcoming,
  results,
  strongAreas,
  weakAreas,
}: {
  upcoming: UpcomingExam[];
  results: ResultRow[];
  strongAreas: string[];
  weakAreas: string[];
}) {
  const trend = results.map((item) => ({ label: new Date(item.date).toLocaleDateString(), value: item.percentage ?? 0 }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">My Exams</h1>
      <UpcomingExamsSection exams={upcoming} />
      <MyResultsSection rows={results} />
      <PerformanceChart points={trend} />
      <WeakAreasCard strongAreas={strongAreas} weakAreas={weakAreas} />
    </div>
  );
}
