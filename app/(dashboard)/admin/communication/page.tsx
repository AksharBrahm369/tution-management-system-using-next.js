"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Clipboard, Mail, MessageCircle, Send, Smartphone } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
  type?: string;
};

type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  audience?: string;
  channels?: string | null;
  status?: string;
  createdAt: string;
};

type AnnouncementChannel = "IN_APP" | "WHATSAPP" | "SMS" | "EMAIL";

type BatchOption = {
  id: string;
  name: string;
  code: string;
  currentStrength?: number;
};

type ContactsResponse = {
  phones: string[];
  emails: string[];
  summary: {
    students: number;
    phones: number;
    emails: number;
  };
};

const channelOptions: Array<{ value: AnnouncementChannel; label: string; hint: string }> = [
  { value: "IN_APP", label: "In-app", hint: "Portal notification" },
  { value: "WHATSAPP", label: "WhatsApp", hint: "Student phones" },
  { value: "EMAIL", label: "Email", hint: "Student emails" },
  { value: "SMS", label: "SMS", hint: "Student phones" },
];

function statusTone(status?: string) {
  switch ((status || "").toUpperCase()) {
    case "PUBLISHED":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30";
    case "SCHEDULED":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30";
    case "DRAFT":
      return "bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/30";
    default:
      return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30";
  }
}

function audienceLabel(audience?: string, batchesById?: Map<string, BatchOption>) {
  const value = audience || "STUDENT";
  if (value.toUpperCase().startsWith("BATCH:")) {
    const batchId = value.slice("BATCH:".length);
    const batch = batchesById?.get(batchId);
    return batch ? `${batch.name} class` : "Selected class";
  }

  switch (value.toUpperCase()) {
    case "SUPER_ADMIN":
      return "Admins";
    case "TEACHER":
      return "Teachers";
    case "STUDENT":
      return "All students";
    case "PARENT":
      return "Parents";
    default:
      return "All students";
  }
}

function parseChannels(channels?: string | null) {
  return (channels || "IN_APP")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function announcementText(item: AnnouncementItem) {
  return `${item.title}\n\n${item.message}\n\n- TuitionPro`;
}

export default function CommunicationPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetMode, setTargetMode] = useState<"ALL_STUDENTS" | "BATCH">("ALL_STUDENTS");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<AnnouncementChannel[]>(["IN_APP"]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [externalActionId, setExternalActionId] = useState<string | null>(null);

  async function load() {
    setError(null);
    const [notificationRes, announcementRes, batchRes] = await Promise.all([
      fetch("/api/admin/notifications", { credentials: "same-origin" }),
      fetch("/api/admin/announcements", { credentials: "same-origin" }),
      fetch("/api/admin/batches?status=ACTIVE&limit=100&sortBy=name&sortOrder=asc", { credentials: "same-origin" }),
    ]);

    if (notificationRes.ok) {
      setNotifications(await notificationRes.json());
    }

    if (announcementRes.ok) {
      setAnnouncements(await announcementRes.json());
    }

    if (batchRes.ok) {
      const payload = await batchRes.json();
      setBatches(Array.isArray(payload.batches) ? payload.batches : []);
    }
  }

  useEffect(() => {
    load().catch((err) => {
      console.error("[communication] initial load failed", err);
      setError("Unable to load communication data.");
    });
  }, []);

  const stats = useMemo(
    () => [
      { label: "Announcements", value: announcements.length },
      { label: "Notifications", value: notifications.length },
      { label: "Unread", value: notifications.filter((item) => !item.isRead).length },
    ],
    [announcements.length, notifications]
  );

  const batchesById = useMemo(() => new Map(batches.map((batch) => [batch.id, batch])), [batches]);

  function toggleChannel(channel: AnnouncementChannel) {
    setSelectedChannels((current) => {
      if (current.includes(channel)) {
        const next = current.filter((item) => item !== channel);
        return next.length > 0 ? next : ["IN_APP"];
      }
      return [...current, channel];
    });
  }

  async function fetchContacts(item: AnnouncementItem) {
    const res = await fetch(`/api/admin/announcements/${item.id}/contacts`, { credentials: "same-origin" });
    if (!res.ok) {
      const text = await res.text().catch(() => "No response body");
      throw new Error(`Contacts failed (${res.status}): ${text}`);
    }
    return (await res.json()) as ContactsResponse;
  }

  async function openStudentWhatsApp(item: AnnouncementItem) {
    setExternalActionId(`${item.id}:whatsapp`);
    setError(null);
    setActionMessage(null);

    try {
      const contacts = await fetchContacts(item);
      const firstPhone = contacts.phones[0];
      if (!firstPhone) throw new Error("No student phone numbers found for this announcement.");

      window.open(`https://wa.me/${firstPhone}?text=${encodeURIComponent(announcementText(item))}`, "_blank", "noopener,noreferrer");
      setActionMessage(
        contacts.summary.phones > 1
          ? `Opened WhatsApp for 1 of ${contacts.summary.phones} student phone numbers. Use the class group button for bulk sharing.`
          : "Opened WhatsApp for the student phone number."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open WhatsApp.");
    } finally {
      setExternalActionId(null);
    }
  }

  function openClassWhatsApp(item: AnnouncementItem) {
    window.open(`https://wa.me/?text=${encodeURIComponent(announcementText(item))}`, "_blank", "noopener,noreferrer");
  }

  async function openEmailCompose(item: AnnouncementItem) {
    setExternalActionId(`${item.id}:email`);
    setError(null);
    setActionMessage(null);

    try {
      const contacts = await fetchContacts(item);
      if (contacts.emails.length === 0) throw new Error("No student email addresses found for this announcement.");

      const subject = encodeURIComponent(item.title);
      const body = encodeURIComponent(announcementText(item));
      const bcc = encodeURIComponent(contacts.emails.join(","));
      window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;
      setActionMessage(`Opened email composer for ${contacts.summary.emails} student email addresses.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open email.");
    } finally {
      setExternalActionId(null);
    }
  }

  async function copySmsText(item: AnnouncementItem) {
    setExternalActionId(`${item.id}:sms`);
    setError(null);
    setActionMessage(null);

    try {
      const contacts = await fetchContacts(item);
      if (contacts.phones.length === 0) throw new Error("No student phone numbers found for this announcement.");

      await navigator.clipboard.writeText(announcementText(item));
      setActionMessage(`Copied SMS text. ${contacts.summary.phones} student phone numbers are available for this announcement.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to prepare SMS text.");
    } finally {
      setExternalActionId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setActionMessage(null);
    setError(null);
    const audience = targetMode === "BATCH" && selectedBatchId ? `BATCH:${selectedBatchId}` : "STUDENT";
    console.log("[communication] handleCreate clicked", { title, message, audience, channels: selectedChannels });
    setLoading(true);

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, audience, channels: selectedChannels, link: "/admin/communication" }),
      });

      if (res.ok) {
        setTitle("");
        setMessage("");
        setTargetMode("ALL_STUDENTS");
        setSelectedBatchId("");
        setSelectedChannels(["IN_APP"]);
        setActionMessage("Announcement created successfully.");
        await load();
        return;
      }

      const text = await res.text().catch(() => "No response body");
      throw new Error(`Create failed (${res.status}): ${text}`);
    } catch (err) {
      console.error("Create failed", err);
      setError(err instanceof Error ? err.message : "Unable to create announcement.");
    } finally {
      setLoading(false);
    }
  }

  async function publishAnnouncement(id: string) {
    setPublishingId(id);
    setError(null);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/announcements/${id}/publish`, {
        method: "POST",
        credentials: "same-origin",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "No response body");
        throw new Error(`Publish failed (${res.status}): ${text}`);
      }

      setActionMessage("Announcement published.");
      await load();
    } catch (err) {
      console.error("Publish failed", err);
      setError(err instanceof Error ? err.message : "Unable to publish announcement.");
    } finally {
      setPublishingId(null);
    }
  }

  async function resendAnnouncement(id: string) {
    setResendingId(id);
    setError(null);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/announcements/${id}/resend`, {
        method: "POST",
        credentials: "same-origin",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "No response body");
        throw new Error(`Resend failed (${res.status}): ${text}`);
      }

      setActionMessage("Announcement resent.");
      await load();
    } catch (err) {
      console.error("Resend failed", err);
      setError(err instanceof Error ? err.message : "Unable to resend announcement.");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_36%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#0b1220_0%,#0f172a_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-200">
              Admin Communication
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Announcements</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Create, publish, and resend institution-wide updates from a single place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-right">
                <div className="text-xl font-semibold text-white tabular-nums">{item.value}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {(error || actionMessage) && (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${error ? "border-rose-500/30 bg-rose-500/10 text-rose-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}`}>
            {error || actionMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Compose announcement</h2>
                <p className="text-sm text-slate-400">Write once, publish instantly to the selected audience.</p>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
                Draft mode
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write the announcement details"
                  rows={7}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Send to</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setTargetMode("ALL_STUDENTS")}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        targetMode === "ALL_STUDENTS"
                          ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                          : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      All students
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMode("BATCH")}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        targetMode === "BATCH"
                          ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                          : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      Class / batch
                    </button>
                  </div>

                  {targetMode === "BATCH" ? (
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      <option value="">Select class / batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name} ({batch.code}) - {batch.currentStrength ?? 0} students
                        </option>
                      ))}
                    </select>
                  ) : null}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Channels</label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {channelOptions.map((option) => {
                      const checked = selectedChannels.includes(option.value);
                      return (
                        <label
                          key={option.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                            checked
                              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-100"
                              : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/20"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleChannel(option.value)}
                            className="mt-1 h-4 w-4 accent-emerald-500"
                          />
                          <span>
                            <span className="block text-sm font-medium">{option.label}</span>
                            <span className="block text-xs text-slate-400">{option.hint}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || (targetMode === "BATCH" && !selectedBatchId)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-cyan-500 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Publishing..." : "Create & Publish"}
                </button>
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Recent Notifications</h2>
                  <p className="text-sm text-slate-400">Newest alerts delivered to users.</p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
                  {notifications.length} items
                </span>
              </div>

              <div className="max-h-90 space-y-3 overflow-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-sm text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{item.title}</div>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{item.message}</p>
                        </div>
                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                          {item.isRead ? "Read" : "Unread"}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Announcements</h2>
                  <p className="text-sm text-slate-400">Drafts, scheduled items, and published updates.</p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs text-slate-300">
                  {announcements.length} items
                </span>
              </div>

              <div className="max-h-125 space-y-3 overflow-auto pr-1">
                {announcements.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-6 text-sm text-slate-400">
                    No announcements created yet.
                  </div>
                ) : (
                  announcements.map((item) => {
                    const isPublishing = publishingId === item.id;
                    const isResending = resendingId === item.id;
                    const channels = parseChannels(item.channels);
                    return (
                      <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 transition hover:border-cyan-400/25 hover:bg-slate-950">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(item.status)}`}>
                                  {(item.status || "draft").toLowerCase()}
                                </span>
                                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                  {audienceLabel(item.audience, batchesById)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-300">{item.message}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {channels.map((channel) => (
                                  <span key={channel} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                                    {channel.replace("_", "-").toLowerCase()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openClassWhatsApp(item)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Class group
                              </button>
                              <button
                                type="button"
                                onClick={() => openStudentWhatsApp(item)}
                                disabled={externalActionId === `${item.id}:whatsapp`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Smartphone className="h-4 w-4" />
                                Student phone
                              </button>
                              <button
                                type="button"
                                onClick={() => openEmailCompose(item)}
                                disabled={externalActionId === `${item.id}:email`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Mail className="h-4 w-4" />
                                Email
                              </button>
                              <button
                                type="button"
                                onClick={() => copySmsText(item)}
                                disabled={externalActionId === `${item.id}:sms`}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-400/10 px-3 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Clipboard className="h-4 w-4" />
                                SMS text
                              </button>
                              <button
                                onClick={() => publishAnnouncement(item.id)}
                                disabled={isPublishing || isResending}
                                className="rounded-xl bg-emerald-500/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isPublishing ? "Publishing..." : "Publish"}
                              </button>
                              <button
                                onClick={() => resendAnnouncement(item.id)}
                                disabled={isPublishing || isResending}
                                className="rounded-xl bg-amber-500/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isResending ? "Resending..." : "Resend"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
