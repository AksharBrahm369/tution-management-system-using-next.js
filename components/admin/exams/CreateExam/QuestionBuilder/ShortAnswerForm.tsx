import React from "react";
import { ExamQuestion } from "../../types";

export default function ShortAnswerForm({ question, onChange }: { question: ExamQuestion; onChange: (question: ExamQuestion) => void }) {
  return (
    <div className="space-y-3">
      <textarea className="min-h-24 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Model answer" value={question.modelAnswer ?? ""} onChange={(event) => onChange({ ...question, modelAnswer: event.target.value })} />
      <input className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Key points comma separated" value={question.answerKeyPoints.join(", ")} onChange={(event) => onChange({ ...question, answerKeyPoints: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
    </div>
  );
}
