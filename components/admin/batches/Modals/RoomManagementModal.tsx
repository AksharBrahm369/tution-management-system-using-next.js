"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Room {
  id: string;
  name: string;
  code: string;
  capacity: number;
  floor?: string | null;
  building?: string | null;
  facilities: string[];
  isActive: boolean;
  _count?: { batches: number };
}

const FACILITIES = ["Air Conditioning", "Projector", "Whiteboard", "Smart Board", "Computer", "WiFi"];

const RoomManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [form, setForm] = useState({
    name: "", code: "", capacity: 30, floor: "", building: "", facilities: [] as string[]
  });

  const { data, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to load rooms");
      return res.json() as Promise<{ rooms: Room[] }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editRoom ? `/api/admin/rooms/${editRoom.id}` : "/api/admin/rooms";
      const method = editRoom ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to save room");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      setShowForm(false);
      setEditRoom(null);
      setForm({ name: "", code: "", capacity: 30, floor: "", building: "", facilities: [] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to delete room");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
    onError: (err: Error) => alert(err.message),
  });

  const openEdit = (room: Room) => {
    setEditRoom(room);
    setForm({
      name: room.name, code: room.code, capacity: room.capacity,
      floor: room.floor ?? "", building: room.building ?? "",
      facilities: room.facilities,
    });
    setShowForm(true);
  };

  const toggleFacility = (f: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Room Management</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowForm(true); setEditRoom(null); setForm({ name: "", code: "", capacity: 30, floor: "", building: "", facilities: [] }); }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={15} /> Add Room
            </button>
            <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Add/Edit Form */}
          {showForm && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                {editRoom ? "Edit Room" : "Add New Room"}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Room Name*</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Room 101" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Code*</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="R101" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Capacity*</label>
                  <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Floor</label>
                  <input value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="1st Floor" className={inputClass} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Building</label>
                  <input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="Main Building" className={inputClass} />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Facilities</label>
                <div className="flex flex-wrap gap-2">
                  {FACILITIES.map((f) => (
                    <label key={f} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700">
                      <input type="checkbox" checked={form.facilities.includes(f)} onChange={() => toggleFacility(f)} className="h-3 w-3 accent-blue-600" />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  {editRoom ? "Update Room" : "Save Room"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditRoom(null); }}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Rooms List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.rooms ?? []).map((room) => (
                <div key={room.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{room.name}</p>
                    <p className="text-xs text-slate-500">
                      Code: {room.code} · Capacity: {room.capacity}
                      {room.floor && ` · Floor ${room.floor}`}
                      {room.building && ` · ${room.building}`}
                    </p>
                    {room.facilities.length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">{room.facilities.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(room)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${room.name}?`)) deleteMutation.mutate(room.id);
                      }}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(data?.rooms ?? []).length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No rooms added yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomManagementModal;
