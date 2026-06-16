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
import CredentialsModal from "../Modals/CredentialsModal";

interface StudentProfilePageProps {
  studentId: string;
  basePath?: string;
}

const StudentProfilePage: React.FC<StudentProfilePageProps> = ({ studentId, basePath = "/admin/students" }) => {
  const [activeTab, setActiveTab] = useState<StudentProfileTab>("overview");
  const [showIdCard, setShowIdCard] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreatingLogin, setIsCreatingLogin] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{
    title: string;
    studentCode: string;
    email: string;
    password: string;
  } | null>(null);

  const [fetchError, setFetchError] = useState<{ status: number; message: string } | null>(null);

  const { data, isLoading, refetch } = useQuery<StudentProfileData>({
    queryKey: ["student-profile", studentId, refreshKey],
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/api/admin/students/${studentId}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setFetchError({ status: response.status, message: payload.error ?? "Failed to load student" });
        throw new Error(payload.error ?? "Failed to load student");
      }
      setFetchError(null);
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
        return <ExamsTab student={data} />;
      case "documents":
        return <DocumentsTab student={data} onChanged={() => { setRefreshKey((value) => value + 1); refetch(); }} />;
      case "timeline":
        return <TimelineTab timeline={timelineQuery.data ?? []} />;
      default:
        return null;
    }
  }, [activeTab, data, refetch, timelineQuery.data]);

  if (fetchError) {
    const is404 = fetchError.status === 404;
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-slate-800 dark:text-slate-100">
          {is404 ? "Student Not Found" : "Access Denied"}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {is404
            ? "This student does not exist or belongs to a different institute."
            : fetchError.message}
        </p>
        <a
          href={basePath}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          ← Back to Students
        </a>
      </div>
    );
  }

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

      setCredentialsModal({
        title: "Student login created successfully.",
        studentCode: data.studentCode,
        email: payload.email,
        password: payload.password,
      });
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

      setCredentialsModal({
        title: "Student password reset successfully.",
        studentCode: data.studentCode,
        email: payload.email,
        password: payload.password,
      });
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
        editHref={`${basePath}/${studentId}/edit`}
        onDownloadId={() => setShowIdCard(true)}
        onChangeStatus={() => setShowStatusModal(true)}
        onCreateStudentLogin={handleCreateLogin}
        isCreatingStudentLogin={isCreatingLogin}
        onResetStudentPassword={handleResetPassword}
        isResettingStudentPassword={isResettingPassword}
      />
      <QuickStatsBar student={data} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {tabsContent}

      {showIdCard && <StudentIDCardModal student={data} onClose={() => setShowIdCard(false)} />}
      {showStatusModal && <ChangeStatusModal studentId={data.id} currentStatus={data.status} onClose={() => setShowStatusModal(false)} onUpdated={() => { setRefreshKey((value) => value + 1); refetch(); }} />}
      {credentialsModal && (
        <CredentialsModal
          title={credentialsModal.title}
          studentCode={credentialsModal.studentCode}
          email={credentialsModal.email}
          password={credentialsModal.password}
          onClose={() => setCredentialsModal(null)}
        />
      )}
    </div>
  );
};

export default StudentProfilePage;
