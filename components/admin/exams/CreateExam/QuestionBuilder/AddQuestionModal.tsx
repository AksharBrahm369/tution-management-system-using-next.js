"use client";

import React, { useState } from "react";
import { ExamQuestion } from "../../types";

export default function AddQuestionModal({
  nextQuestionNumber,
  hasNegativeMarking,
  onAdd,
  onClose,
}: {
  nextQuestionNumber: number;
  hasNegativeMarking: boolean;
  onAdd: (question: ExamQuestion) => void;
  onClose: () => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("MCQ");
  const [marks, setMarks] = useState(1);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState("A");
  const [modelAnswer, setModelAnswer] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");

  const submit = () => {
    if (!questionText.trim()) return;
    onAdd({
      questionNumber: nextQuestionNumber,
      questionText,
      questionType,
      marks,
      negativeMarks: hasNegativeMarking ? negativeMarks : 0,
      optionA: optionA || null,
      optionB: optionB || null,
      optionC: optionC || null,
      optionD: optionD || null,
      correctOption: questionType === "MCQ" ? correctOption : null,
      modelAnswer: modelAnswer || null,
      answerKeyPoints: [],
      topic: topic || null,
      difficulty,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Add Question</h3>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="text-slate-500">Question Type</span>
            <select className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
              {[
                "MCQ",
                "SHORT_ANSWER",
                "LONG_ANSWER",
                "TRUE_FALSE",
                "FILL_BLANK",
                "MATCH",
              ].map((item) => (
                <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="text-slate-500">Marks</span>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="number" value={marks} onChange={(e) => setMarks(Number(e.target.value))} />
          </label>

          {hasNegativeMarking && (
            <label className="text-sm">
              <span className="text-slate-500">Negative Marks</span>
              <input className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" type="number" value={negativeMarks} onChange={(e) => setNegativeMarks(Number(e.target.value))} />
            </label>
          )}

          <label className="text-sm">
            <span className="text-slate-500">Difficulty</span>
            <select className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {[
                "EASY",
                "MEDIUM",
                "HARD",
              ].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 text-sm">
            <span className="text-slate-500">Question Text</span>
            <textarea className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
          </label>

          {questionType === "MCQ" && (
            <>
              <input className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Option A" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
              <input className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Option B" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
              <input className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Option C" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
              <input className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Option D" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
              <label className="md:col-span-2 text-sm">
                <span className="text-slate-500">Correct Option</span>
                <select className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={correctOption} onChange={(e) => setCorrectOption(e.target.value)}>
                  {[
                    "A",
                    "B",
                    "C",
                    "D",
                  ].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          {questionType !== "MCQ" && (
            <label className="md:col-span-2 text-sm">
              <span className="text-slate-500">Model Answer</span>
              <textarea className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} />
            </label>
          )}

          <input className="md:col-span-2 rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" placeholder="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Cancel</button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={submit}>Add Question</button>
        </div>
      </div>
    </div>
  );
}
