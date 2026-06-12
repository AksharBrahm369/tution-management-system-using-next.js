import React from "react";
import Link from "next/link";
import { Award, BookOpen, Calendar, Clock, GraduationCap, Inbox, Percent, Play } from "lucide-react";
import { StudentProfileData } from "../types";

interface ExamsTabProps {
  student: StudentProfileData;
}

const ExamsTab: React.FC<ExamsTabProps> = ({ student }) => {
  const examResults = student.examResults || [];

  // Calculate Academic Averages
  const examCount = examResults.length;
  const totalScore = examResults.reduce((sum, r) => sum + r.score, 0);
  const totalMax = examResults.reduce((sum, r) => sum + r.totalMarks, 0);
  const avgScore = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : null;

  // Category and Performance Status styling
  const getPerformanceTag = (category: string) => {
    switch (category) {
      case "TOPPER":
        return { text: "Outstanding (Topper)", style: "bg-indigo-50 text-indigo-700 border-indigo-200/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/40" };
      case "GOOD":
        return { text: "Above Average (Good)", style: "bg-teal-50 text-teal-700 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40" };
      case "AVERAGE":
        return { text: "Steady (Average)", style: "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40" };
      default:
        return { text: "Needs Focus (Weak)", style: "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40" };
    }
  };

  const performance = getPerformanceTag(student.category);

  return (
    <div className="space-y-6">
      
      {/* SECTION 5: ACADEMIC INSIGHTS HEADER & METRIC GRID */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-805 dark:bg-slate-900/60">
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Academic Insights
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Key indicators and class progression records.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Standard & Batch */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <GraduationCap size={12} className="text-blue-500" /> Class & Standard
            </span>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {student.standard?.name ?? "Unassigned"}
            </p>
            <p className="mt-0.5 text-xs text-slate-505 dark:text-slate-500 font-semibold">
              Batch: {student.currentBatch?.name ?? "None"}
            </p>
          </div>

          {/* Card 2: Joining & Enrollment */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Calendar size={12} className="text-emerald-500" /> Enrollment
            </span>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {student.joiningDate ? new Date(student.joiningDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "N/A"}
            </p>
            <p className="mt-0.5 text-xs text-slate-505 dark:text-slate-500 font-semibold">
              Year: {student.academicYear}
            </p>
          </div>

          {/* Card 3: Performance & Status */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Award size={12} className="text-indigo-500" /> Performance Status
            </span>
            <div className="mt-2">
              <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${performance.style}`}>
                {performance.text}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-505 dark:text-slate-500 font-semibold">
              Category: {student.category}
            </p>
          </div>

          {/* Card 4: Exam Count & Avg Score */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Percent size={12} className="text-purple-500" /> Test Health
            </span>
            <p className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {avgScore !== null ? `${avgScore}% Average` : "No scores yet"}
            </p>
            <p className="mt-0.5 text-xs text-slate-505 dark:text-slate-500 font-semibold">
              Total Exams: {examCount}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 11: EXAM HISTORY OR ONBOARDING STATE */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-805 dark:bg-slate-900/60">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-2.5 dark:border-slate-800/80 mb-4">
          Exam History Timeline
        </h3>

        {examCount === 0 ? (
          /* ONBOARDING STATE */
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <Inbox size={20} />
            </div>
            <h4 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
              No exams recorded yet
            </h4>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-450 dark:text-slate-500">
              This student is ready to take exams. Schedule a class test or term exam for the batch "{student.currentBatch?.name ?? "math"}" to record marks.
            </p>
            <div className="mt-5">
              <Link
                href="/admin/exams"
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Play size={12} fill="currentColor" /> Schedule First Exam
              </Link>
            </div>
          </div>
        ) : (
          /* TIMELINE VIEW */
          <div className="relative border-l border-slate-150 pl-5 ml-2.5 dark:border-slate-800 space-y-6">
            {examResults.map((exam, index) => {
              const scorePercent = Math.round((exam.score / exam.totalMarks) * 100);
              let scoreColor = "bg-emerald-500";
              let textColor = "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20";
              if (scorePercent < 45) {
                scoreColor = "bg-rose-500";
                textColor = "text-rose-700 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20";
              } else if (scorePercent < 75) {
                scoreColor = "bg-amber-500";
                textColor = "text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20";
              }

              return (
                <div key={exam.id} className="relative">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[26px] mt-1.5 flex h-3 w-3 items-center justify-center rounded-full ${scoreColor} ring-4 ring-white dark:ring-slate-900`} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {exam.examName}
                      </h4>
                      <p className="text-xs text-slate-455 dark:text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">{exam.subject}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock size={11} /> {new Date(exam.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {exam.score} / {exam.totalMarks}
                        </p>
                        <div className="mt-1 w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                          <div className={`h-1 rounded-full ${scoreColor}`} style={{ width: `${scorePercent}%` }} />
                        </div>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${textColor}`}>
                        {scorePercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default ExamsTab;
