"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SettingsLayout from "./SettingsLayout";
import SettingsSidebar from "./SettingsSidebar";
import InstituteProfile from "./InstituteProfile";
import AcademicsSection from "./AcademicsSection";
import AcademicYears from "./AcademicYears";
import FeeAndGST from "./FeeAndGST";
import Integrations from "./Integrations";
import SecuritySettings from "./SecuritySettings";
import BackupRestore from "./BackupRestore";
import DataManagement from "./DataManagement";
import type { SettingsApiResponse, SettingsSection } from "./types";

const sectionOrder: SettingsSection[] = ["profile", "academics", "academic-years", "gst", "notifications", "integrations", "security", "backup", "data", "about"];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const { data, isLoading, refetch } = useQuery<SettingsApiResponse>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) throw new Error("Failed to load settings");
      return response.json();
    },
  });

  const content = useMemo(() => {
    if (!data) return null;
    switch (activeSection) {
      case "profile": return <InstituteProfile settings={data.settings} onSaved={() => refetch()} />;
      case "academics": return <AcademicsSection />;
      case "academic-years": return <AcademicYears currentAcademicYear={data.settings.currentAcademicYear} academicYears={data.academicYears} onChanged={() => refetch()} />;
      case "gst": return <FeeAndGST settings={data.settings} onSaved={() => refetch()} />;
      case "notifications": return <NotificationsSection />;
      case "integrations": return <Integrations settings={data.settings} integrations={data.integrations} onSaved={() => refetch()} />;
      case "security": return <SecuritySettings settings={data.settings} onSaved={() => refetch()} />;
      case "backup": return <BackupRestore backups={data.backups} onChanged={() => refetch()} />;
      case "data": return <DataManagement />;
      case "about": return <AboutSection />;
      default: return null;
    }
  }, [activeSection, data, refetch]);

  return (
    <SettingsLayout>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <SettingsSidebar activeSection={activeSection} onChange={setActiveSection} />
        <main className="min-w-0 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Module 13</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Institute profile, academic years, GST, integrations, security, backups, and data controls.</p>
          </div>
          {isLoading ? <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/70"><div className="h-8 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /></div> : content}
        </main>
      </div>
    </SettingsLayout>
  );
}

function NotificationsSection() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Notifications</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Communication preferences are already managed in Module 9. Use this area as a quick summary and shortcut.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
          ["SMS", "Enabled in communication module"],
          ["WhatsApp", "Enabled in communication module"],
          ["Email", "Enabled in communication module"],
        ].map(([label, note]) => (
          <div key={label} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="font-medium text-slate-900 dark:text-white">{label}</p>
            <p className="mt-1 text-sm text-slate-500">{note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">About TuitionPro</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">TuitionPro is an all-in-one institute management platform for admissions, academics, attendance, fees, communication, and reporting.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <InfoCard title="Version" value="Module 13" />
        <InfoCard title="Built For" value="Tuition Institutes" />
        <InfoCard title="Support" value="Admin Dashboard" />
      </div>
    </section>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"><p className="text-xs uppercase tracking-[0.16em] text-slate-400">{title}</p><p className="mt-2 font-semibold text-slate-900 dark:text-white">{value}</p></div>;
}
