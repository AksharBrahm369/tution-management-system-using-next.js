import React from "react";
import { ExamQuestion } from "../../types";

export default function MCQForm({ question, onChange }: { question: ExamQuestion; onChange: (question: ExamQuestion) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(["optionA", "optionB", "optionC", "optionD"] as const).map((key) => <input key={key} className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder={key.replace("option", "Option ")} value={question[key] ?? ""} onChange={(event) => onChange({ ...question, [key]: event.target.value })} />)}
      <select className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={question.correctOption ?? "A"} onChange={(event) => onChange({ ...question, correctOption: event.target.value })}>{["A","B","C","D"].map((item) => <option key={item} value={item}>{item}</option>)}</select>
    </div>
  );
}
