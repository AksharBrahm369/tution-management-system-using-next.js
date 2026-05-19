"use client";

import { useState } from "react";
import { ExamItem } from "../types";
import OverviewTab from "./OverviewTab";
import ResultsTab from "./ResultsTab";
import AnalyticsTab from "./AnalyticsTab";
import QuestionsTab from "./QuestionsTab";

export default function ExamTabs({ exam }: { exam: ExamItem }) {
  const [tab, setTab] = useState<"overview" | "results" | "analytics" | "questions">("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className={`rounded-lg px-3 py-2 text-sm ${tab === "overview" ? "bg-blue-600 text-white" : "border"}`} onClick={() => setTab("overview")}>Overview</button>
        <button className={`rounded-lg px-3 py-2 text-sm ${tab === "results" ? "bg-blue-600 text-white" : "border"}`} onClick={() => setTab("results")}>Results</button>
        <button className={`rounded-lg px-3 py-2 text-sm ${tab === "analytics" ? "bg-blue-600 text-white" : "border"}`} onClick={() => setTab("analytics")}>Analytics</button>
        {exam.type === "ONLINE_TEST" && (
          <button className={`rounded-lg px-3 py-2 text-sm ${tab === "questions" ? "bg-blue-600 text-white" : "border"}`} onClick={() => setTab("questions")}>Questions</button>
        )}
      </div>

      {tab === "overview" && <OverviewTab exam={exam} />}
      {tab === "results" && <ResultsTab exam={exam} />}
      {tab === "analytics" && <AnalyticsTab exam={exam} />}
      {tab === "questions" && exam.type === "ONLINE_TEST" && <QuestionsTab exam={exam} />}
    </div>
  );
}
