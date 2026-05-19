"use client";

import { useEffect, useMemo, useState } from "react";
import TestInstructions from "./TestInstructions";
import NavigationGrid from "./NavigationGrid";
import TimerBar from "./TimerBar";
import QuestionPanel from "./QuestionPanel";
import SubmitTestModal from "./SubmitTestModal";

type Question = {
  id: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
};

export default function OnlineTestPage({
  examId,
  title,
  duration,
  questions,
}: {
  examId: string;
  title: string;
  duration: number;
  questions: Question[];
}) {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(duration * 60);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const answeredSet = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((question, index) => {
      if (answers[question.id]) set.add(index);
    });
    return set;
  }, [answers, questions]);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const onBlur = () => {
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        if (next >= 5) {
          setShowSubmit(true);
        }
        return next;
      });
    };

    const preventContext = (event: MouseEvent) => event.preventDefault();
    const preventCopy = (event: ClipboardEvent) => event.preventDefault();

    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("paste", preventCopy);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("paste", preventCopy);
    };
  }, [started]);

  const submit = async () => {
    const payload = {
      answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, answer: value })),
      tabSwitchCount,
    };

    const response = await fetch(`/api/student/exams/${examId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Failed to submit");
      return;
    }

    const data = await response.json();
    setMessage(data.autoScore !== undefined ? `Submitted. Auto score: ${data.autoScore}` : "Test submitted successfully.");
    setShowSubmit(false);
  };

  if (!started) {
    return <TestInstructions title={title} duration={duration} onStart={() => setStarted(true)} />;
  }

  const question = questions[current];

  return (
    <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-3 rounded-xl border p-4 dark:border-slate-700">
        <TimerBar secondsLeft={secondsLeft} />
        <p className="text-xs text-red-600">Tab Switches: {tabSwitchCount}</p>
        <NavigationGrid count={questions.length} current={current} answered={answeredSet} onJump={setCurrent} />
        <button className="w-full rounded-lg bg-red-600 px-3 py-2 text-white" onClick={() => setShowSubmit(true)}>Submit Test</button>
      </aside>

      <main className="space-y-4">
        <QuestionPanel
          question={question}
          answer={answers[question.id]}
          onAnswer={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
        />
        <div className="flex justify-between">
          <button className="rounded-lg border px-4 py-2" disabled={current === 0} onClick={() => setCurrent((prev) => Math.max(0, prev - 1))}>Previous</button>
          <button className="rounded-lg border px-4 py-2" disabled={current === questions.length - 1} onClick={() => setCurrent((prev) => Math.min(questions.length - 1, prev + 1))}>Next</button>
        </div>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
      </main>

      {showSubmit && <SubmitTestModal onClose={() => setShowSubmit(false)} onSubmit={submit} />}
    </div>
  );
}
