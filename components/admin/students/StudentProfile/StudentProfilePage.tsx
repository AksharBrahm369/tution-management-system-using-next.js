"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentProfileData } from "../types";
import ProfileHeader from "./ProfileHeader";
import QuickStatsBar from "./QuickStatsBar";
import ProfileTabs, { StudentProfileTab } from "./ProfileTabs";
import OverviewTab from "./OverviewTab";
import AttendanceTab from "./AttendanceTab";
import FeesTab from "./FeesTab";
import ExamsTab from "./ExamsTab";
import DocumentsTab from "./DocumentsTab";
import TimelineTab from "./TimelineTab";
import StudentIDCardModal from "../Modals/StudentIDCardModal";
import ChangeStatusModal from "../Modals/ChangeStatusModal";

interface StudentProfilePageProps {
  studentId: string;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ studentId }) => {
  const [activeTab, setActiveTab] = useState<StudentProfileTab>("overview");
  const [showIdCard, setShowIdCard] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, refetch } = useQuery<StudentProfileData>({
    queryKey: ["student-profile", studentId, refreshKey],
    queryFn: async () => {
      const response = await fetch(`/api/admin/students/${studentId}`);
      if (!response.ok) throw new Error("Failed to load student");
      return response.json();
    },
  });

  const timelineQuery = useQuery<Array<{ id: string; title: string; description: string; createdAt: string; type: string }>>({
    queryKey: ["student-timeline", studentId, refreshKey],
    enabled: Boolean(data),
    queryFn: async () => {
      const response = await fetch(`/api/admin/students/${studentId}/timeline`);
      if (!response.ok) throw new Error("Failed to load timeline");
      return response.json();
    },
  });

  const tabsContent = useMemo(() => {
    if (!data) return null;

    switch (activeTab) {
      case "overview":
        return <OverviewTab student={data} />;
      case "attendance":
        return <AttendanceTab student={data} />;
      case "fees":
        return <FeesTab student={data} />;
      case "exams":
        return <ExamsTab />;
      case "documents":
        return <DocumentsTab student={data} onChanged={() => { setRefreshKey((value) => value + 1); refetch(); }} />;
      case "timeline":
        return <TimelineTab timeline={timelineQuery.data ?? []} />;
      default:
        return null;
    }
  }, [activeTab, data, refetch, timelineQuery.data]);

  if (isLoading || !data) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfileHeader student={data} onDownloadId={() => setShowIdCard(true)} onChangeStatus={() => setShowStatusModal(true)} />
      <QuickStatsBar attendancePercent={data.attendancePercent} feesPaid={data.feesPaid} pendingFees={data.pendingFees} examsTaken={data.examResults.length} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {tabsContent}

      {showIdCard && <StudentIDCardModal student={data} onClose={() => setShowIdCard(false)} />}
      {showStatusModal && <ChangeStatusModal studentId={data.id} currentStatus={data.status} onClose={() => setShowStatusModal(false)} onUpdated={() => { setRefreshKey((value) => value + 1); refetch(); }} />}
    </div>
  );
};

export default StudentProfilePage;
