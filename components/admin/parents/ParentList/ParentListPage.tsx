"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Grid2X2, Table2, MoreHorizontal, Phone, Mail } from "lucide-react";

export default function ParentListPage() {
  const [parents, setParents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [batchId, setBatchId] = useState("");
  const [loginStatus, setLoginStatus] = useState<"ALL" | "ACTIVE" | "NO_LOGIN">("ALL");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(false);
  const [showCreateParent, setShowCreateParent] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    fatherName: "",
    fatherPhone: "",
    fatherEmail: "",
    fatherOccup: "",
    motherName: "",
    motherPhone: "",
    motherEmail: "",
    motherOccup: "",
    guardianName: "",
    guardianPhone: "",
    guardianRel: "",
    primaryContact: "FATHER",
  });

  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (batchId) query.set("batchId", batchId);
      if (loginStatus !== "ALL") query.set("loginStatus", loginStatus);
      const response = await fetch(`/api/admin/parents?${query.toString()}`, { credentials: "same-origin" });
      const data = await response.json();
      setParents(data.parents ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createParent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/admin/parents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(createForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create parent");
      }

      setShowCreateParent(false);
      setCreateForm({
        fatherName: "",
        fatherPhone: "",
        fatherEmail: "",
        fatherOccup: "",
        motherName: "",
        motherPhone: "",
        motherEmail: "",
        motherOccup: "",
        guardianName: "",
        guardianPhone: "",
        guardianRel: "",
        primaryContact: "FATHER",
      });
      await load();
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create parent");
    } finally {
      setCreateLoading(false);
    }
  }

  const stats = useMemo(() => {
    const active = parents.filter((parent) => parent.loginStatus === "ACTIVE").length;
    const noLogin = parents.filter((parent) => parent.loginStatus === "NO_LOGIN").length;
    const unread = parents.reduce((count, parent) => count + (parent.unreadMessages ?? 0), 0);
    return [
      { label: "Total Parents", value: parents.length },
      { label: "Active Login", value: active },
      { label: "No Login Yet", value: noLogin },
      { label: "Unread Messages", value: unread },
    ];
  }, [parents]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Parents</h1>
          <p className="mt-2 text-sm text-slate-500">Manage all parent accounts</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/parents/ptm" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Schedule PTM</Link>
          <button type="button" onClick={() => setShowCreateParent(true)} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Add Parent</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{loading ? "..." : item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto]">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-800">
            <Search className="h-4 w-4 text-slate-400" />
            <input aria-label="Search parents" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search by parent name / phone / email" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <input aria-label="Filter parents by batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Batch filter" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
          <select aria-label="Filter parents by login status" value={loginStatus} onChange={(e) => setLoginStatus(e.target.value as any)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950">
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="NO_LOGIN">No Login</option>
          </select>
          <button type="button" onClick={load} className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-medium text-white">Apply</button>
          <button type="button" onClick={() => { setSearch(""); setBatchId(""); setLoginStatus("ALL"); setTimeout(load, 0); }} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Reset</button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-500">View toggle</div>
          <div className="flex rounded-2xl border border-slate-200 p-1 dark:border-slate-800">
            <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`rounded-xl px-3 py-2 text-sm ${view === "grid" ? "bg-cyan-600 text-white" : "text-slate-600 dark:text-slate-300"}`}><Grid2X2 className="mr-2 inline h-4 w-4" />Grid</button>
            <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")} className={`rounded-xl px-3 py-2 text-sm ${view === "table" ? "bg-cyan-600 text-white" : "text-slate-600 dark:text-slate-300"}`}><Table2 className="mr-2 inline h-4 w-4" />Table</button>
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {parents.map((parent) => (
            <div key={parent.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-semibold text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-200">{(parent.fatherName || parent.motherName || parent.guardianName || "P").slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">{parent.fatherName || parent.motherName || parent.guardianName || "Parent"}</div>
                    <div className="text-sm text-slate-500">{parent.primaryContact}</div>
                  </div>
                </div>
                <button type="button" aria-label="Open parent actions" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{parent.fatherPhone || parent.motherPhone || parent.guardianPhone || "-"}</div>
                <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{parent.user?.email || parent.fatherEmail || parent.motherEmail || "-"}</div>
                <div>Children: {parent.childCount}</div>
                <div>Login: <span className="font-medium">{parent.loginStatus}</span></div>
                <div>Unread Messages: {parent.unreadMessages ?? 0}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/parents/${parent.id}`} className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-900">View</Link>
                <button type="button" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Message</button>
                <Link href="/admin/parents/ptm" className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Schedule PTM</Link>
              </div>
              <div className="mt-4 text-xs text-slate-500">Last Active: {parent.user?.lastLogin ? new Date(parent.user.lastLogin).toLocaleString() : "Never"}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Children</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Unread</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => (
                <tr key={parent.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{parent.fatherName || parent.motherName || parent.guardianName || "Parent"}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{parent.fatherPhone || parent.motherPhone || parent.guardianPhone || "-"}<br />{parent.user?.email || parent.fatherEmail || parent.motherEmail || "-"}</td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{parent.childCount}<br />{parent.students.map((student: any) => `${student.firstName} ${student.lastName}`).join(", ")}</td>
                  <td className="px-4 py-4">{parent.loginStatus}</td>
                  <td className="px-4 py-4">{parent.unreadMessages ?? 0}</td>
                  <td className="px-4 py-4"><Link href={`/admin/parents/${parent.id}`} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-medium text-white">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Add Parent</h2>
                <p className="mt-1 text-sm text-slate-500">Create a parent profile from the admin list.</p>
              </div>
              <button type="button" onClick={() => setShowCreateParent(false)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Close</button>
            </div>

            <form onSubmit={createParent} className="mt-6 space-y-4">
              {createError && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">{createError}</div>}

              <div className="grid gap-4 md:grid-cols-2">
                <input aria-label="Father name" value={createForm.fatherName} onChange={(e) => setCreateForm({ ...createForm, fatherName: e.target.value })} placeholder="Father name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Father phone" value={createForm.fatherPhone} onChange={(e) => setCreateForm({ ...createForm, fatherPhone: e.target.value })} placeholder="Father phone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Father email" value={createForm.fatherEmail} onChange={(e) => setCreateForm({ ...createForm, fatherEmail: e.target.value })} placeholder="Father email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Father occupation" value={createForm.fatherOccup} onChange={(e) => setCreateForm({ ...createForm, fatherOccup: e.target.value })} placeholder="Father occupation" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Mother name" value={createForm.motherName} onChange={(e) => setCreateForm({ ...createForm, motherName: e.target.value })} placeholder="Mother name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Mother phone" value={createForm.motherPhone} onChange={(e) => setCreateForm({ ...createForm, motherPhone: e.target.value })} placeholder="Mother phone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Mother email" value={createForm.motherEmail} onChange={(e) => setCreateForm({ ...createForm, motherEmail: e.target.value })} placeholder="Mother email" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Mother occupation" value={createForm.motherOccup} onChange={(e) => setCreateForm({ ...createForm, motherOccup: e.target.value })} placeholder="Mother occupation" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Guardian name" value={createForm.guardianName} onChange={(e) => setCreateForm({ ...createForm, guardianName: e.target.value })} placeholder="Guardian name" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Guardian phone" value={createForm.guardianPhone} onChange={(e) => setCreateForm({ ...createForm, guardianPhone: e.target.value })} placeholder="Guardian phone" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <input aria-label="Guardian relation" value={createForm.guardianRel} onChange={(e) => setCreateForm({ ...createForm, guardianRel: e.target.value })} placeholder="Guardian relation" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950" />
                <select aria-label="Primary contact" value={createForm.primaryContact} onChange={(e) => setCreateForm({ ...createForm, primaryContact: e.target.value })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950">
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                </select>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateParent(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
                <button type="submit" disabled={createLoading} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{createLoading ? "Saving..." : "Create Parent"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
