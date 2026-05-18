import React from "react";
import { ExamQuestion } from "../../types";

export default function TrueFalseForm({ question, onChange }: { question: ExamQuestion; onChange: (question: ExamQuestion) => void }) {
  return (
    <select className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={question.correctOption ?? "TRUE"} onChange={(event) => onChange({ ...question, correctOption: event.target.value })}>
      <option value="TRUE">True</option>
      <option value="FALSE">False</option>
    </select>
  );
}
