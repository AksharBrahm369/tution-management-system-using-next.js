import React from "react";
import { ExamQuestion } from "../../types";
import QuestionCard from "./QuestionCard";

export default function QuestionList({ questions, onChange }: { questions: ExamQuestion[]; onChange: (questions: ExamQuestion[]) => void }) {
  function move(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((question, idx) => ({ ...question, questionNumber: idx + 1 })));
  }
  return (
    <div className="space-y-3">
      {questions.map((question, index) => <QuestionCard key={question.questionNumber} question={question} onDelete={() => onChange(questions.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, questionNumber: idx + 1 })))} onMove={(direction) => move(index, direction)} />)}
      {!questions.length && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No questions added yet.</div>}
    </div>
  );
}
