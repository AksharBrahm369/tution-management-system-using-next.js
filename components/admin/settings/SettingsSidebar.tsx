"use client";

import { Settings, GraduationCap, Receipt, Bell, PlugZap, Shield, Database, HardDriveDownload, Info, BookOpen } from "lucide-react";
import type { SettingsSection } from "./types";

const sections: Array<{ id: SettingsSection; label: string; icon: React.ReactNode }> = [
  { id: "profile", label: "Institute Profile", icon: <Settings size={18} /> },
  { id: "academics", label: "Subjects & Rooms", icon: <BookOpen size={18} /> },
  { id: "academic-years", label: "Academic Years", icon: <GraduationCap size={18} /> },
  { id: "gst", label: "Fee & GST", icon: <Receipt size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
  { id: "integrations", label: "Integrations", icon: <PlugZap size={18} /> },
  { id: "security", label: "Security", icon: <Shield size={18} /> },
  { id: "backup", label: "Backup & Restore", icon: <HardDriveDownload size={18} /> },
  { id: "data", label: "Data Management", icon: <Database size={18} /> },
  { id: "about", label: "About TuitionPro", icon: <Info size={18} /> },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

export default function SettingsSidebar({ activeSection, onChange }: SettingsSidebarProps) {
  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:sticky lg:top-6 lg:w-72 lg:h-fit">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Settings</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">Configuration</h2>
      </div>
      <nav className="space-y-1">
        {sections.map((section) => {
          const active = section.id === activeSection;
          return (
            <button
              key={section.id}
              onClick={() => onChange(section.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"}`}
            >
              <span className="flex-shrink-0">{section.icon}</span>
              <span className="font-medium">{section.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}