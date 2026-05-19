"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { CreateExamForm } from "./CreateExamTypes";
import QuestionList from "./QuestionBuilder/QuestionList";
import AddQuestionModal from "./QuestionBuilder/AddQuestionModal";

export default function Step3QuestionSetup({
  form,
  onChange,
  onPrevious,
  onNext,
}: {
  form: CreateExamForm;
  onChange: (form: CreateExamForm) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);

  const totalQuestionMarks = form.questions.reduce((sum, question) => sum + question.marks, 0);

  const appendQuestion = (question: CreateExamForm["questions"][number]) => {
    onChange({ ...form, questions: [...form.questions, question] });
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Exam Type Setup</h2>
      {form.type !== "ONLINE_TEST" ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Offline exam selected. Marks will be entered from the marks entry page.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Total Questions: <span className="font-semibold">{form.questions.length}</span> | Total Marks: <span className="font-semibold">{totalQuestionMarks}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
            >
              <Plus className="h-4 w-4" /> Add Question
            </button>
          </div>

          <QuestionList questions={form.questions} />

          {open && (
            <AddQuestionModal
              hasNegativeMarking={form.hasNegativeMarking}
              nextQuestionNumber={form.questions.length + 1}
              onAdd={appendQuestion}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button className="rounded-xl border px-5 py-2" onClick={onPrevious}>Previous</button>
        <button className="rounded-xl bg-blue-600 px-5 py-2 text-white" onClick={onNext}>Next Step</button>
      </div>
    </div>
  );
}
