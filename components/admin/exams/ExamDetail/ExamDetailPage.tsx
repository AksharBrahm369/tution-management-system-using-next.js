import { ExamItem } from "../types";
import ExamHeader from "./ExamHeader";
import ExamTabs from "./ExamTabs";

export default function ExamDetailPage({ exam, basePath = "/admin/exams" }: { exam: ExamItem; basePath?: string }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <ExamHeader exam={exam} basePath={basePath} />
      <ExamTabs exam={exam} />
    </div>
  );
}
