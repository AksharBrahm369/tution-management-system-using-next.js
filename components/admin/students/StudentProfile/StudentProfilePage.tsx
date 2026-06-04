"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const [isCreatingLogin, setIsCreatingLogin] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
        return <FeesTab student={data} onChanged={() => { setRefreshKey((value) => value + 1); refetch(); }} />;
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

  const handleCreateLogin = async () => {
    setIsCreatingLogin(true);
    try {
      const response = await fetch(`/api/admin/students/${studentId}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create student login");
      }

      const credentialText = [
        `Student Code: ${data.studentCode}`,
        `Login Email: ${payload.email}`,
        `Temporary Password: ${payload.password}`,
      ].join("\n");

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(credentialText);
        toast.success("Student login created. Credentials copied to clipboard.");
      } else {
        toast.success("Student login created.");
      }

      window.alert(`Student login created successfully.\n\n${credentialText}`);
      setRefreshKey((value) => value + 1);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create student login");
    } finally {
      setIsCreatingLogin(false);
    }
  };

  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    try {
      const response = await fetch(`/api/admin/students/${studentId}/login`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to reset student password");
      }

      const credentialText = [
        `Student Code: ${data.studentCode}`,
        `Login Email: ${payload.email}`,
        `New Temporary Password: ${payload.password}`,
      ].join("\n");

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(credentialText);
        toast.success("Student password reset. New credentials copied to clipboard.");
      } else {
        toast.success("Student password reset.");
      }

      window.alert(`Student password reset successfully.\n\n${credentialText}`);
      setRefreshKey((value) => value + 1);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset student password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProfileHeader
        student={data}
        onDownloadId={() => setShowIdCard(true)}
        onChangeStatus={() => setShowStatusModal(true)}
        onCreateStudentLogin={handleCreateLogin}
        isCreatingStudentLogin={isCreatingLogin}
        onResetStudentPassword={handleResetPassword}
        isResettingStudentPassword={isResettingPassword}
      />
      <QuickStatsBar attendancePercent={data.attendancePercent} feesPaid={data.feesPaid} pendingFees={data.pendingFees} examsTaken={data.examResults.length} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {tabsContent}

      {showIdCard && <StudentIDCardModal student={data} onClose={() => setShowIdCard(false)} />}
      {showStatusModal && <ChangeStatusModal studentId={data.id} currentStatus={data.status} onClose={() => setShowStatusModal(false)} onUpdated={() => { setRefreshKey((value) => value + 1); refetch(); }} />}
    </div>
  );
};

export default StudentProfilePage;
