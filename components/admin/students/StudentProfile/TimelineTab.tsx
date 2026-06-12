import React from "react";
import { IndianRupee, CheckCircle, GraduationCap, FileText, UserPlus, Calendar, Clock, Inbox } from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  type: string;
}

interface TimelineTabProps {
  timeline: TimelineItem[];
}

function getTimelineStyle(type: string, title: string) {
  const t = type?.toUpperCase() || "";
  const titleText = title?.toLowerCase() || "";
  
  if (t === "FEE" || titleText.includes("fee") || titleText.includes("payment")) {
    return {
      icon: <IndianRupee size={12} />,
      color: "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 ring-4 ring-white dark:ring-slate-900"
    };
  }
  if (t === "ATTENDANCE" || titleText.includes("attendance") || titleText.includes("present") || titleText.includes("absent") || titleText.includes("marked")) {
    return {
      icon: <CheckCircle size={12} />,
      color: "bg-teal-500/10 text-teal-650 dark:text-teal-400 border border-teal-500/20 ring-4 ring-white dark:ring-slate-900"
    };
  }
  if (t === "EXAM" || titleText.includes("exam") || titleText.includes("score") || titleText.includes("result") || titleText.includes("test")) {
    return {
      icon: <GraduationCap size={12} />,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 ring-4 ring-white dark:ring-slate-900"
    };
  }
  if (t === "DOCUMENT" || titleText.includes("document") || titleText.includes("upload") || titleText.includes("file")) {
    return {
      icon: <FileText size={12} />,
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 ring-4 ring-white dark:ring-slate-900"
    };
  }
  return {
    icon: <UserPlus size={12} />,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 ring-4 ring-white dark:ring-slate-900"
  };
}

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-805 dark:bg-slate-900/60">
      <div className="mb-6 border-b border-slate-100 pb-3 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Student Timeline & Audit Log
          </h3>
          <p className="text-xs text-slate-405 dark:text-slate-500 mt-0.5">
            Chronological ledger of events, payments, exams, and record updates.
          </p>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="py-12 text-center">
          <Inbox size={24} className="mx-auto text-slate-350 dark:text-slate-600 mb-3" />
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500">No activity logged for this student yet.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-150 pl-6 ml-3 dark:border-slate-800 space-y-6 py-1">
          {timeline.map((item) => {
            const style = getTimelineStyle(item.type, item.title);
            return (
              <div key={item.id} className="relative">
                {/* Visual Icon Node on Timeline */}
                <span className={`absolute -left-[35px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ${style.color}`}>
                  {style.icon}
                </span>

                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 sm:text-right">
                      <Clock size={10} />
                      {new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-505 dark:text-slate-400 leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TimelineTab;
