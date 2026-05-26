"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, MessageSquare, Megaphone, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  createdAt: string;
};

type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  status?: string;
  audience?: string;
  createdAt: string;
};

interface CommunicationPanelProps {
  title: string;
  subtitle: string;
  accent: "violet" | "rose";
}

function accentStyles(accent: CommunicationPanelProps["accent"]) {
  return accent === "violet"
    ? {
        border: "border-violet-200/70 dark:border-violet-500/20",
        badge: "bg-violet-600 text-white",
        glow: "from-violet-600 to-indigo-600",
        icon: "text-violet-600 dark:text-violet-300",
      }
    : {
        border: "border-rose-200/70 dark:border-rose-500/20",
        badge: "bg-rose-600 text-white",
        glow: "from-rose-500 to-orange-500",
        icon: "text-rose-600 dark:text-rose-300",
      };
}

function formatTime(value: string) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return "recently";
  }
}

export default function CommunicationPanel({ title, subtitle, accent }: CommunicationPanelProps) {
  const styles = accentStyles(accent);

  const { data: announcements, isLoading: announcementsLoading } = useQuery<AnnouncementItem[]>({
    queryKey: ["dashboard-announcements"],
    queryFn: async () => {
      const response = await fetch("/api/admin/announcements", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Failed to load announcements");
      return response.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery<NotificationItem[]>({
    queryKey: ["dashboard-notifications"],
    queryFn: async () => {
      const response = await fetch("/api/admin/notifications", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Failed to load notifications");
      return response.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const latestAnnouncements = announcements?.slice(0, 3) ?? [];
  const latestNotifications = notifications?.slice(0, 3) ?? [];
  const unreadCount = notifications?.filter((item) => !item.isRead).length ?? 0;

  return (
    <section className={`overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-slate-900/70 ${styles.border}`}>
      <div className={`bg-linear-to-r ${styles.glow} px-6 py-5 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Communication
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-white/85">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-white/15 px-4 py-3 text-right backdrop-blur-sm">
            <div className="text-2xl font-semibold tabular-nums">{unreadCount}</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/80">Unread</div>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-slate-200/80 p-6 dark:border-slate-800 lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className={`h-5 w-5 ${styles.icon}`} />
              <h3 className="font-semibold text-slate-900 dark:text-white">Announcements</h3>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}>
              {announcements?.length ?? 0} total
            </span>
          </div>

          <div className="space-y-3">
            {announcementsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : latestAnnouncements.length > 0 ? (
              latestAnnouncements.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.message}</p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {(item.status || "published").toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                    {formatTime(item.createdAt)}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No announcements yet.
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className={`h-5 w-5 ${styles.icon}`} />
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Recent updates
            </span>
          </div>

          <div className="space-y-3">
            {notificationsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : latestNotifications.length > 0 ? (
              latestNotifications.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${
                    item.isRead
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/60"
                      : "border-sky-200 bg-sky-50/70 dark:border-sky-500/20 dark:bg-sky-950/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-slate-300" : "bg-sky-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-medium text-slate-900 dark:text-white">{item.title}</h4>
                        <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {item.type || "general"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.message}</p>
                      <div className="mt-3 text-xs text-slate-500 dark:text-slate-500">{formatTime(item.createdAt)}</div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No notifications yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
