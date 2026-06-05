"use client";

import React, { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { CreateExamForm } from "./CreateExamTypes";
import QuestionList from "./QuestionBuilder/QuestionList";
import AddQuestionModal from "./QuestionBuilder/AddQuestionModal";
import AIGenerateQuestionsModal from "./QuestionBuilder/AIGenerateQuestionsModal";
import { SubjectOption } from "../types";

export default function Step3QuestionSetup({
  form,
  subjects,
  onChange,
  onPrevious,
  onNext,
}: {
  form: CreateExamForm;
  subjects: SubjectOption[];
  onChange: (form: CreateExamForm) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const isOnlineExam = form.deliveryMode === "ONLINE";
  const selectedSubject = subjects.find((subject) => subject.id === form.subjectId);

  const totalQuestionMarks = form.questions.reduce((sum, question) => sum + question.marks, 0);

  const appendQuestion = (question: CreateExamForm["questions"][number]) => {
    onChange({ ...form, questions: [...form.questions, question] });
    setOpen(false);
  };

  const appendQuestions = (questions: CreateExamForm["questions"]) => {
    onChange({
      ...form,
      questions: [
        ...form.questions,
        ...questions.map((question, index) => ({
          ...question,
          questionNumber: form.questions.length + index + 1,
        })),
      ],
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Exam Type Setup</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange({ ...form, deliveryMode: "OFFLINE" })}
          className={`rounded-xl border p-4 text-left transition ${
            !isOnlineExam
              ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
              : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <div className="font-medium">Offline Exam</div>
          <p className="mt-1 text-sm opacity-80">Teachers will enter marks later from the marks entry page.</p>
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...form, deliveryMode: "ONLINE" })}
          className={`rounded-xl border p-4 text-left transition ${
            isOnlineExam
              ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
              : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <div className="font-medium">Online Exam</div>
          <p className="mt-1 text-sm opacity-80">Students will take the exam online with questions configured below.</p>
        </button>
      </div>

      {!isOnlineExam ? (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          Offline exam selected. Marks will be entered from the marks entry page.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Total Questions: <span className="font-semibold">{form.questions.length}</span> | Total Marks: <span className="font-semibold">{totalQuestionMarks}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200"
              >
                <Sparkles className="h-4 w-4" /> AI Generate
              </button>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
              >
                <Plus className="h-4 w-4" /> Add Question
              </button>
            </div>
          </div>
          <QuestionList
            questions={form.questions}
            onChange={(questions) => onChange({ ...form, questions })}
          />
          {open && (
            <AddQuestionModal
              hasNegativeMarking={form.hasNegativeMarking}
              nextQuestionNumber={form.questions.length + 1}
              onAdd={appendQuestion}
              onClose={() => setOpen(false)}
            />
          )}
          {aiOpen && (
            <AIGenerateQuestionsModal
              examTitle={form.title}
              subjectName={selectedSubject?.name}
              hasNegativeMarking={form.hasNegativeMarking}
              nextQuestionNumber={form.questions.length + 1}
              onAddQuestions={appendQuestions}
              onClose={() => setAiOpen(false)}
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
