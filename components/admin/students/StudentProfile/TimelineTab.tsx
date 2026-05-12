import React from "react";

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

const TimelineTab: React.FC<TimelineTabProps> = ({ timeline }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Timeline</h3>
      <div className="mt-6 space-y-4">
        {timeline.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineTab;
