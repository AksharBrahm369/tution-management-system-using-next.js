"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, 
  DoorOpen, 
  GraduationCap,
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Building, 
  Layers, 
  Users, 
  Bookmark,
  Calendar
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  _count: {
    batches: number;
    teachers: number;
  };
}

interface Room {
  id: string;
  name: string;
  code: string;
  capacity: number;
  floor: string | null;
  building: string | null;
  facilities: string[];
  _count?: {
    batches: number;
  };
}

interface Standard {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  stats?: {
    totalStudents: number;
    totalTeachers: number;
    activeBatches: number;
    upcomingExams: number;
    pendingFees: number;
  };
}

const COMMON_FACILITIES = ["Whiteboard", "Projector", "Air Conditioning", "WiFi", "Computer", "Audio System"];

export default function AcademicsSection() {
  const [activeTab, setActiveTab] = useState<"subjects" | "standards" | "rooms">("subjects");
  const queryClient = useQueryClient();

  // Search queries
  const [subjectSearch, setSubjectSearch] = useState("");
  const [standardSearch, setStandardSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");

  // Modals state
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "", isActive: true });

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState<{
    name: string;
    code: string;
    capacity: number;
    floor: string;
    building: string;
    facilities: string[];
  }>({ name: "", code: "", capacity: 30, floor: "", building: "", facilities: [] });

  const [showStandardModal, setShowStandardModal] = useState(false);
  const [standardForm, setStandardForm] = useState({ name: "", order: "" });

  // Get data
  const { data: subjectsData, isLoading: loadingSubjects } = useQuery<{ subjects: Subject[] }>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    }
  });

  const { data: roomsData, isLoading: loadingRooms } = useQuery<{ rooms: Room[] }>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    }
  });

  const { data: standardsData, isLoading: loadingStandards } = useQuery<{ standards: Standard[] }>({
    queryKey: ["admin-standards-options"],
    queryFn: async () => {
      const res = await fetch("/api/admin/standards");
      if (!res.ok) throw new Error("Failed to fetch standards");
      return res.json();
    }
  });

  const subjects = subjectsData?.subjects ?? [];
  const standards = standardsData?.standards ?? [];
  const rooms = roomsData?.rooms ?? [];

  // Mutations
  const subjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: typeof subjectForm }) => {
      const url = id ? `/api/admin/subjects/${id}` : "/api/admin/subjects";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save subject");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setShowSubjectModal(false);
      setEditingSubject(null);
      setSubjectForm({ name: "", code: "", description: "", isActive: true });
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to delete subject");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
    onError: (err: Error) => alert(err.message),
  });

  const roomMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: typeof roomForm }) => {
      const url = id ? `/api/admin/rooms/${id}` : "/api/admin/rooms";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save room");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setShowRoomModal(false);
      setEditingRoom(null);
      setRoomForm({ name: "", code: "", capacity: 30, floor: "", building: "", facilities: [] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const standardMutation = useMutation({
    mutationFn: async (data: typeof standardForm) => {
      const res = await fetch("/api/admin/standards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, order: Number(data.order) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save standard");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standards-options"] });
      setShowStandardModal(false);
      setStandardForm({ name: "", order: "" });
      window.dispatchEvent(new Event("tuitionpro:standards-changed"));
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rooms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to delete room");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
    onError: (err: Error) => alert(err.message),
  });

  const handleOpenSubjectModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectForm({
        name: sub.name,
        code: sub.code,
        description: sub.description ?? "",
        isActive: sub.isActive,
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({ name: "", code: "", description: "", isActive: true });
    }
    setShowSubjectModal(true);
  };

  const handleOpenRoomModal = (rm?: Room) => {
    if (rm) {
      setEditingRoom(rm);
      setRoomForm({
        name: rm.name,
        code: rm.code,
        capacity: rm.capacity,
        floor: rm.floor ?? "",
        building: rm.building ?? "",
        facilities: rm.facilities,
      });
    } else {
      setEditingRoom(null);
      setRoomForm({ name: "", code: "", capacity: 30, floor: "", building: "", facilities: [] });
    }
    setShowRoomModal(true);
  };

  const toggleFacility = (facility: string) => {
    setRoomForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  // Filtered lists
  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const filteredStandards = standards.filter(
    (standard) =>
      standard.name.toLowerCase().includes(standardSearch.toLowerCase()) ||
      String(standard.order).includes(standardSearch)
  );

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
      r.code.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5";

  return (
    <section className="space-y-6">
      {/* Tab Selectors */}
      <div className="flex gap-1.5 rounded-2xl border border-slate-200 bg-slate-50/50 p-1.5 dark:border-slate-800 dark:bg-slate-900/50 w-full md:w-fit">
        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "subjects"
              ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BookOpen size={16} />
          Subjects ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab("standards")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "standards"
              ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <GraduationCap size={16} />
          Standards ({standards.length})
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === "rooms"
              ? "bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <DoorOpen size={16} />
          Classrooms ({rooms.length})
        </button>
      </div>

      {activeTab === "subjects" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search subjects by name or code..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => handleOpenSubjectModal()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Add Subject
            </button>
          </div>

          {/* Table / Grid */}
          {loadingSubjects ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 text-center p-6">
              <Bookmark size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No subjects found</p>
              <p className="text-sm text-slate-400 mt-1">Try resetting search filter or add a new subject.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {sub.name}
                        </h4>
                        <span className="mt-1 inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {sub.code}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          sub.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {sub.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem]">
                      {sub.description || "No description provided."}
                    </p>
                  </div>

                  {/* Footer & Stats */}
                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1" title="Active Batches using subject">
                        <Calendar size={14} className="text-slate-400" />
                        <strong>{sub._count.batches}</strong> Batches
                      </span>
                      <span className="flex items-center gap-1" title="Teachers assigned to subject">
                        <Users size={14} className="text-slate-400" />
                        <strong>{sub._count.teachers}</strong> Teachers
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenSubjectModal(sub)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                        title="Edit Subject"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (sub._count.batches > 0 || sub._count.teachers > 0) {
                            alert(
                              `Cannot delete subject "${sub.name}". It is currently assigned to ${sub._count.batches} batch(es) and ${sub._count.teachers} teacher(s).`
                            );
                            return;
                          }
                          if (confirm(`Are you sure you want to delete the subject "${sub.name}"?`)) {
                            deleteSubjectMutation.mutate(sub.id);
                          }
                        }}
                        className={`rounded-lg p-1.5 transition ${
                          sub._count.batches > 0 || sub._count.teachers > 0
                            ? "text-slate-200 dark:text-slate-800 cursor-not-allowed"
                            : "text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        }`}
                        title={
                          sub._count.batches > 0 || sub._count.teachers > 0
                            ? "Cannot delete subject in use"
                            : "Delete Subject"
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "standards" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search standards by name or order..."
                value={standardSearch}
                onChange={(e) => setStandardSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => setShowStandardModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Add Standard
            </button>
          </div>

          {loadingStandards ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : filteredStandards.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 text-center p-6">
              <GraduationCap size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No standards found</p>
              <p className="text-sm text-slate-400 mt-1">Try resetting search filter or add a new standard.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStandards.map((standard) => (
                <div
                  key={standard.id}
                  className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Order {standard.order}</p>
                      <h4 className="mt-1 font-bold text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                        {standard.name}
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      Active
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                      <strong className="block text-base text-slate-900 dark:text-white">{standard.stats?.totalStudents ?? 0}</strong>
                      Students
                    </span>
                    <span className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                      <strong className="block text-base text-slate-900 dark:text-white">{standard.stats?.activeBatches ?? 0}</strong>
                      Batches
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search rooms by name or code..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
              />
            </div>
            <button
              onClick={() => handleOpenRoomModal()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Add Room
            </button>
          </div>

          {/* Table / Grid */}
          {loadingRooms ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 text-center p-6">
              <DoorOpen size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No rooms found</p>
              <p className="text-sm text-slate-400 mt-1">Try resetting search filter or add a new classroom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((rm) => (
                <div
                  key={rm.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {rm.name}
                        </h4>
                        <span className="mt-1 inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {rm.code}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                        Cap: {rm.capacity}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {rm.building && (
                        <div className="flex items-center gap-1.5">
                          <Building size={14} className="text-slate-400" />
                          <span>{rm.building}</span>
                        </div>
                      )}
                      {rm.floor && (
                        <div className="flex items-center gap-1.5">
                          <Layers size={14} className="text-slate-400" />
                          <span>{rm.floor} Floor</span>
                        </div>
                      )}
                    </div>

                    {/* Facilities Chips */}
                    {rm.facilities && rm.facilities.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1">
                        {rm.facilities.map((fac) => (
                          <span
                            key={fac}
                            className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400"
                          >
                            {fac}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer & Stats */}
                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1" title="Active Batches using room">
                        <Calendar size={14} className="text-slate-400" />
                        <strong>{rm._count?.batches ?? 0}</strong> Active Batches
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenRoomModal(rm)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white transition"
                        title="Edit Room"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => {
                          const activeCount = rm._count?.batches ?? 0;
                          if (activeCount > 0) {
                            alert(
                              `Cannot delete room "${rm.name}". It is currently assigned to ${activeCount} active batch(es).`
                            );
                            return;
                          }
                          if (confirm(`Are you sure you want to delete the classroom "${rm.name}"?`)) {
                            deleteRoomMutation.mutate(rm.id);
                          }
                        }}
                        className={`rounded-lg p-1.5 transition ${
                          (rm._count?.batches ?? 0) > 0
                            ? "text-slate-200 dark:text-slate-800 cursor-not-allowed"
                            : "text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        }`}
                        title={
                          (rm._count?.batches ?? 0) > 0
                            ? "Cannot delete room in use"
                            : "Delete Room"
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Standard Modal */}
      {showStandardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs transition">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Standard</h3>
              <button
                onClick={() => setShowStandardModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!standardForm.name.trim()) return alert("Standard Name is required");
                const order = Number(standardForm.order);
                if (!Number.isInteger(order) || order <= 0) return alert("Display order must be a positive number");
                standardMutation.mutate(standardForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className={labelClass}>Standard Name *</label>
                <input
                  type="text"
                  placeholder="e.g. 13th Standard"
                  value={standardForm.name}
                  onChange={(e) => setStandardForm({ ...standardForm, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Display Order *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 13"
                  value={standardForm.order}
                  onChange={(e) => setStandardForm({ ...standardForm, order: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStandardModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={standardMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-75 transition"
                >
                  {standardMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    "Save Standard"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs transition">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingSubject ? "Edit Subject" : "Add New Subject"}
              </h3>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!subjectForm.name.trim()) return alert("Subject Name is required");
                if (!subjectForm.code.trim()) return alert("Subject Code is required");
                subjectMutation.mutate({
                  id: editingSubject?.id,
                  data: subjectForm,
                });
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className={labelClass}>Subject Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Subject Code *</label>
                <input
                  type="text"
                  placeholder="e.g. MATH"
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                  className={inputClass}
                  disabled={!!editingSubject}
                  required
                />
                {!editingSubject && (
                  <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider">A unique identification code (cannot be changed later)</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  placeholder="e.g. Fundamental algebraic operations, geometry, trigonometry..."
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  rows={3}
                  className={inputClass}
                />
              </div>

              {editingSubject && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                  <button
                    type="button"
                    onClick={() => setSubjectForm({ ...subjectForm, isActive: !subjectForm.isActive })}
                    className={`relative h-6 w-11 rounded-full transition ${
                      subjectForm.isActive ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        subjectForm.isActive ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Status</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Inactive subjects are hidden from active filters</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subjectMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-75 transition"
                >
                  {subjectMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    "Save Subject"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs transition">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingRoom ? "Edit Room" : "Add New Room"}
              </h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!roomForm.name.trim()) return alert("Room Name is required");
                if (!roomForm.code.trim()) return alert("Room Code is required");
                if (roomForm.capacity <= 0) return alert("Capacity must be greater than 0");
                roomMutation.mutate({
                  id: editingRoom?.id,
                  data: roomForm,
                });
              }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Room Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 101"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Room Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. R101"
                    value={roomForm.code}
                    onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value.toUpperCase() })}
                    className={inputClass}
                    disabled={!!editingRoom}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 0 })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st, Ground"
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Building</label>
                <input
                  type="text"
                  placeholder="e.g. Main Block"
                  value={roomForm.building}
                  onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Facilities</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
                  {COMMON_FACILITIES.map((facility) => {
                    const selected = roomForm.facilities.includes(facility);
                    return (
                      <button
                        type="button"
                        key={facility}
                        onClick={() => toggleFacility(facility)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition border ${
                          selected
                            ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {selected && <Check size={12} />}
                        {facility}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roomMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-75 transition"
                >
                  {roomMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    "Save Room"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
