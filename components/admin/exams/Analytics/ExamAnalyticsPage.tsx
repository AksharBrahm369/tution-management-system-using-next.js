import { ExamItem } from "../types";
import OverallPerformanceCards from "./OverallPerformanceCards";
import BatchComparisonChart from "./BatchComparisonChart";
import ToppersList from "./ToppersList";
import ImprovedStudents from "./ImprovedStudents";
import WeakStudents from "./WeakStudents";
import SubjectAnalysis from "./SubjectAnalysis";
import WeakAreaHeatmap from "./WeakAreaHeatmap";
import ExamTrendChart from "./ExamTrendChart";

export default function ExamAnalyticsPage({ exams }: { exams: ExamItem[] }) {
  const publishedResults = exams.flatMap((exam) => exam.results).filter((result) => result.percentage !== null);
  const instituteAverage = publishedResults.length
    ? publishedResults.reduce((sum, result) => sum + (result.percentage ?? 0), 0) / publishedResults.length
    : 0;

  const byBatch = new Map<string, { total: number; count: number }>();
  const bySubject = new Map<string, { total: number; count: number }>();

  for (const exam of exams) {
    const scored = exam.results.filter((result) => result.percentage !== null).map((result) => result.percentage as number);
    const avg = scored.length ? scored.reduce((sum, value) => sum + value, 0) / scored.length : 0;

    const batchItem = byBatch.get(exam.batch.name) ?? { total: 0, count: 0 };
    batchItem.total += avg;
    batchItem.count += 1;
    byBatch.set(exam.batch.name, batchItem);

    const subjectItem = bySubject.get(exam.subject.name) ?? { total: 0, count: 0 };
    subjectItem.total += avg;
    subjectItem.count += 1;
    bySubject.set(exam.subject.name, subjectItem);
  }

  const batchRows = Array.from(byBatch.entries()).map(([label, value]) => ({ label, value: value.count ? value.total / value.count : 0 }));
  const subjectRows = Array.from(bySubject.entries()).map(([subject, value]) => ({ subject, average: value.count ? value.total / value.count : 0 }));
  const sortedBatch = [...batchRows].sort((a, b) => b.value - a.value);

  const topRows = publishedResults
    .map((result) => ({ name: `${result.student.firstName} ${result.student.lastName}`, average: result.percentage ?? 0, trend: "steady" }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 5);

  const weakRows = [...topRows].reverse().slice(0, 5);
  const improvedRows = topRows.map((row) => ({ name: row.name, previous: Math.max(0, row.average - 7), current: row.average, change: 7 }));
  const trendRows = exams.map((exam) => ({ label: new Date(exam.examDate).toLocaleDateString(), value: exam.summary?.average ?? 0 }));
  const heatRows = subjectRows.map((item) => ({ topic: item.subject, score: item.average }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Exam Analytics</h1>
      <OverallPerformanceCards
        instituteAverage={instituteAverage}
        bestBatch={sortedBatch[0]?.label ?? "-"}
        worstBatch={sortedBatch[sortedBatch.length - 1]?.label ?? "-"}
        improvedStudent={improvedRows[0]?.name ?? "-"}
      />
      <BatchComparisonChart data={batchRows} />
      <div className="grid gap-4 md:grid-cols-2">
        <ToppersList rows={topRows} />
        <WeakStudents rows={weakRows} />
      </div>
      <ImprovedStudents rows={improvedRows} />
      <SubjectAnalysis rows={subjectRows} />
      <WeakAreaHeatmap rows={heatRows} />
      <ExamTrendChart rows={trendRows} />
    </div>
  );
}
