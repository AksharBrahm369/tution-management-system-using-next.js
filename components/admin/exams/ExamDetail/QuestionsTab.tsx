import { ExamItem } from "../types";

export default function QuestionsTab({ exam }: { exam: ExamItem }) {
  if (!exam.questions || exam.questions.length === 0) {
    return <p className="text-sm text-slate-500">No questions configured for this exam.</p>;
  }

  return (
    <div className="space-y-3">
      {exam.questions.map((question) => (
        <div key={question.id ?? `${question.questionNumber}-${question.questionText}`} className="rounded-xl border p-4 dark:border-slate-700">
          <p className="font-medium">Q{question.questionNumber}. {question.questionText}</p>
          <p className="mt-1 text-xs text-slate-500">{question.questionType} | {question.marks} marks | {question.difficulty}</p>
        </div>
      ))}
    </div>
  );
}
