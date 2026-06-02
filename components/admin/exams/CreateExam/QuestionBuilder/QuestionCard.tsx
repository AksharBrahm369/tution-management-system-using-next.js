import React from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { ExamQuestion } from "../../types";

export default function QuestionCard({ question, onDelete, onMove }: { question: ExamQuestion; onDelete: () => void; onMove: (direction: "up" | "down") => void }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="flex justify-between gap-3">
        <div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">Q{question.questionNumber}. {question.questionType}</span><span className="ml-2 text-xs text-slate-500">{question.marks} marks</span></div>
        <div className="flex gap-1"><button type="button" aria-label={`Move question ${question.questionNumber} up`} onClick={() => onMove("up")}><ArrowUp size={16} /></button><button type="button" aria-label={`Move question ${question.questionNumber} down`} onClick={() => onMove("down")}><ArrowDown size={16} /></button><button type="button" aria-label={`Delete question ${question.questionNumber}`} onClick={onDelete}><Trash2 size={16} /></button></div>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">{question.questionText}</p>
      {question.questionType === "MCQ" && <div className="mt-3 grid gap-1 text-sm text-slate-600 dark:text-slate-300"><div>A. {question.optionA}</div><div>B. {question.optionB}</div><div>C. {question.optionC}</div><div>D. {question.optionD}</div><div className="font-medium">Correct: {question.correctOption}</div></div>}
      <div className="mt-3 text-xs text-slate-500">Topic: {question.topic || "General"} | {question.difficulty}</div>
    </div>
  );
}
