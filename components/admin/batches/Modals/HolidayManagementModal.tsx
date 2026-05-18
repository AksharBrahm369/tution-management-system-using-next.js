"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  description?: string | null;
  isRecurring: boolean;
  affectsAll: boolean;
}

const HOLIDAY_TYPES = ["NATIONAL", "STATE", "INSTITUTE", "EXAM", "SPECIAL"];
const TYPE_BADGE: Record<string, string> = {
  NATIONAL: "bg-red-100 text-red-700",
  STATE: "bg-orange-100 text-orange-700",
  INSTITUTE: "bg-blue-100 text-blue-700",
  EXAM: "bg-purple-100 text-purple-700",
  SPECIAL: "bg-emerald-100 text-emerald-700",
};

const HolidayManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [form, setForm] = useState({
    name: "", date: "", type: "NATIONAL", description: "", isRecurring: false, affectsAll: true
  });

  const { data, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const res = await fetch("/api/admin/holidays");
      if (!res.ok) throw new Error("Failed to load holidays");
      return res.json() as Promise<{ holidays: Holiday[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editHoliday ? `/api/admin/holidays/${editHoliday.id}` : "/api/admin/holidays";
      const method = editHoliday ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to save holiday");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holidays"] });
      setShowForm(false); setEditHoliday(null);
      setForm({ name: "", date: "", type: "NATIONAL", description: "", isRecurring: false, affectsAll: true });
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });

  const openEdit = (h: Holiday) => {
    setEditHoliday(h);
    setForm({
      name: h.name,
      date: h.date.split("T")[0],
      type: h.type, description: h.description ?? "",
      isRecurring: h.isRecurring, affectsAll: h.affectsAll,
    });
    setShowForm(true);
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Holiday Management</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowForm(true); setEditHoliday(null); setForm({ name: "", date: "", type: "NATIONAL", description: "", isRecurring: false, affectsAll: true }); }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={15} /> Add Holiday
            </button>
            <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showForm && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                {editHoliday ? "Edit Holiday" : "Add Holiday"}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Name*</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Republic Day" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Date*</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Type*</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                    {HOLIDAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" className={inputClass} />
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="accent-blue-600" />
                  Recurring yearly
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.affectsAll} onChange={(e) => setForm({ ...form, affectsAll: e.target.checked })} className="accent-blue-600" />
                  Affects all batches
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {editHoliday ? "Update" : "Save"} Holiday
                </button>
                <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}</div>
          ) : (
            <div className="space-y-3">
              {(data?.holidays ?? []).map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">{h.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE[h.type] ?? "bg-slate-100 text-slate-600"}`}>
                        {h.type}
                      </span>
                      {h.isRecurring && <span className="text-xs text-slate-400">Recurring</span>}
                    </div>
                    <p className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(h)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm("Delete this holiday?")) deleteMutation.mutate(h.id); }} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(data?.holidays ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No holidays added yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HolidayManagementModal;
