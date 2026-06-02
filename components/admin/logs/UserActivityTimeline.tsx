"use client";

import { useQuery } from "@tanstack/react-query";
import type { ActivityLogRow } from "@/types/activityLog";

interface ActorOption {
  id: string;
  name: string;
  role: string;
}

interface UserActivityTimelineProps {
  actors: ActorOption[];
  selectedUserId: string;
  onUserChange: (userId: string) => void;
}

export default function UserActivityTimeline({
  actors,
  selectedUserId,
  onUserChange,
}: UserActivityTimelineProps) {
  const { data, isLoading } = useQuery<{ user: { name: string; email: string }; logs: ActivityLogRow[] }>({
    queryKey: ["admin-logs-user-timeline", selectedUserId],
    enabled: Boolean(selectedUserId),
    queryFn: async () => {
      const res = await fetch(`/api/admin/logs/user/${selectedUserId}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load user timeline");
      return res.json();
    },
  });

  return (
    <section className="tp-card animate-fade-up p-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">User Activity Timeline</h2>
      <select
        aria-label="Select user for activity timeline"
        className="mb-4 h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        value={selectedUserId}
        onChange={(e) => onUserChange(e.target.value)}
      >
        <option value="">Select a user…</option>
        {actors.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} — {a.role}
          </option>
        ))}
      </select>

      {!selectedUserId && (
        <p className="text-sm text-slate-500">Choose a user to view their activity history.</p>
      )}

      {selectedUserId && isLoading && (
        <p className="text-sm text-slate-500">Loading timeline…</p>
      )}

      {selectedUserId && data && (
        <div className="space-y-0">
          <p className="mb-4 text-sm text-slate-600">
            Activity for <strong>{data.user.name}</strong> ({data.user.email})
          </p>
          <ol className="relative border-l border-slate-200 pl-6 dark:border-slate-700">
            {data.logs.map((log) => (
              <li key={log.id} className="mb-6 ml-2">
                <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                <time className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</time>
                <p className="font-medium text-slate-900 dark:text-white">{log.action}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{log.description}</p>
                {log.entityName && (
                  <p className="mt-1 text-xs text-slate-500">Entity: {log.entityName}</p>
                )}
              </li>
            ))}
            {!data.logs.length && (
              <li className="text-sm text-slate-500">No activity recorded for this user.</li>
            )}
          </ol>
        </div>
      )}
    </section>
  );
}
