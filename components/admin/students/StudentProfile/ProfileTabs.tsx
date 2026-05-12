import React from "react";

export type StudentProfileTab = "overview" | "attendance" | "fees" | "exams" | "documents" | "timeline";

interface ProfileTabsProps {
  activeTab: StudentProfileTab;
  onTabChange: (tab: StudentProfileTab) => void;
}

const tabs: Array<{ key: StudentProfileTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "attendance", label: "Attendance" },
  { key: "fees", label: "Fees" },
  { key: "exams", label: "Exams & Results" },
  { key: "documents", label: "Documents" },
  { key: "timeline", label: "Timeline" },
];

const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${activeTab === tab.key ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;
