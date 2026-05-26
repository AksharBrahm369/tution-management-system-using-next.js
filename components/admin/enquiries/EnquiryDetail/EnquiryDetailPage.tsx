"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import EnquiryHeader from "./EnquiryHeader";
import FollowUpTimeline from "./FollowUpTimeline";
import DemoClassesTab from "./DemoClassesTab";
import AddFollowUpModal from "./AddFollowUpModal";
import ScheduleDemoModal from "./ScheduleDemoModal";
import ConvertToStudentModal from "./ConvertToStudentModal";
import { EnquiryDetailData } from "../types";

interface EnquiryDetailPageProps {
  enquiryId: string;
}

const tabs = ["Follow-up Timeline", "Demo Classes", "Notes"] as const;

type Tab = (typeof tabs)[number];

export default function EnquiryDetailPage({ enquiryId }: EnquiryDetailPageProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<EnquiryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Follow-up Timeline");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, { credentials: "same-origin" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load enquiry");
      }
      setData(payload.enquiry as EnquiryDetailData);
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load enquiry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [enquiryId]);

  useEffect(() => {
    if (searchParams.get("action") === "follow-up") {
      setShowFollowUp(true);
    }
  }, [searchParams]);

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">Loading enquiry...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">Enquiry not found.</div>;
  }

  return (
    <div className="space-y-6">
      <EnquiryHeader enquiry={data} onAddFollowUp={() => setShowFollowUp(true)} onScheduleDemo={() => setShowDemo(true)} onConvert={() => setShowConvert(true)} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-2xl px-4 py-2 text-sm font-medium ${activeTab === tab ? "bg-cyan-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Follow-up Timeline" && <FollowUpTimeline followUps={data.followUps} onAddFollowUp={() => setShowFollowUp(true)} />}
          {activeTab === "Demo Classes" && <DemoClassesTab demoClasses={data.demoClasses} onScheduleDemo={() => setShowDemo(true)} />}
          {activeTab === "Notes" && (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notes</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Student Interest</div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{data.interestedIn.length > 0 ? data.interestedIn.join(", ") : "-"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Source Detail</div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{data.sourceDetail || "-"}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 md:col-span-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Enquiry Notes</div>
                  <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{data.notes || "No notes added."}</div>
                </div>
                {data.convertedStudent ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 md:col-span-2">
                    Converted student: {data.convertedStudent.fullName} ({data.convertedStudent.studentCode})
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Student Info</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div>Name: {data.studentName}</div>
              <div>Class: {data.studentClass || "-"}</div>
              <div>Age: {data.studentAge ?? "-"}</div>
              <div>Interested in: {data.interestedIn.length > 0 ? data.interestedIn.join(", ") : "-"}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Parent Info</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div>Name: {data.parentName}</div>
              <div>Phone: {data.parentPhone}</div>
              <div>Email: {data.parentEmail || "-"}</div>
              <div>Assigned To: {data.assignedTo || "Unassigned"}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Status History</h3>
            <div className="mt-4 space-y-3">
              {data.timeline.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300">{item.description}</div>
                  <div className="mt-2 text-xs text-slate-500">{new Date(item.date).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddFollowUpModal open={showFollowUp} enquiryId={data.id} onClose={() => setShowFollowUp(false)} onSaved={load} />
      <ScheduleDemoModal open={showDemo} enquiryId={data.id} onClose={() => setShowDemo(false)} onSaved={load} />
      <ConvertToStudentModal open={showConvert} enquiry={data} onClose={() => setShowConvert(false)} onSaved={load} />
    </div>
  );
}
