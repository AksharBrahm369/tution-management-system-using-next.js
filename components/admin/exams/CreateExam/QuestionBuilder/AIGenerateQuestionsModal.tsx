"use client";

import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ExamQuestion } from "../../types";

export default function AIGenerateQuestionsModal({
  examTitle,
  subjectName,
  hasNegativeMarking,
  nextQuestionNumber,
  onAddQuestions,
  onClose,
}: {
  examTitle: string;
  subjectName?: string;
  hasNegativeMarking: boolean;
  nextQuestionNumber: number;
  onAddQuestions: (questions: ExamQuestion[]) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [pattern, setPattern] = useState<"STANDARD_MIXED" | "MCQ_HEAVY" | "THEORY_HEAVY">("STANDARD_MIXED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (notes.trim().length < 20) {
      setError("Please paste enough notes so AI can build good questions.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/exams/ai-generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notes: notes.trim(),
          questionCount,
          examTitle: examTitle.trim(),
          subjectName,
          hasNegativeMarking,
          pattern,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to generate questions");
      }

      const generatedQuestions = Array.isArray(payload.questions) ? payload.questions : [];
      const numberedQuestions = generatedQuestions.map((question: ExamQuestion, index: number) => ({
        ...question,
        questionNumber: nextQuestionNumber + index,
      }));

      onAddQuestions(numberedQuestions);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Generate Questions with AI</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Paste your notes, choose how many questions you want, and AI will create online exam questions for you.
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <label className="text-sm">
            <span className="text-slate-500">How many questions?</span>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              type="number"
              min={1}
              max={25}
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.min(25, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>

          <label className="text-sm">
            <span className="text-slate-500">Question Pattern</span>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              value={pattern}
              onChange={(e) => setPattern(e.target.value as "STANDARD_MIXED" | "MCQ_HEAVY" | "THEORY_HEAVY")}
            >
              <option value="STANDARD_MIXED">Standard Mixed Paper</option>
              <option value="MCQ_HEAVY">MCQ Heavy Online Test</option>
              <option value="THEORY_HEAVY">Theory Heavy Paper</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="text-slate-500">Notes for AI</span>
            <textarea
              className="mt-1 min-h-48 w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Paste chapter notes, definitions, formulas, important points, solved examples, or revision content here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60" onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating..." : "Generate Questions"}
          </button>
        </div>
      </div>
    </div>
  );
}
