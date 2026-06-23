"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormDraft } from "@/hooks/useFormDraft";

type FeeRecord = {
  id: string;
  studentId: string;
  receiptNumber: string;
  month: number;
  year: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  dueDate?: string;
  student: {
    firstName: string;
    lastName: string;
    studentCode: string;
    phone?: string | null;
  };
  batch: {
    name: string;
    code: string;
  } | null;
};

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  studentCode: string;
  phone?: string | null;
  status: string;
  feeStatus?: string;
  batch?: {
    id: string;
    name: string;
    code: string;
    fees?: number;
  } | null;
  standard?: {
    id: string;
    name: string;
  } | null;
};

type Mode = "pending" | "manual";
type RecordStatus = "PAID" | "PENDING";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function period(month: number, year: number) {
  return `${monthNames[month - 1] ?? "Month"} ${year}`;
}

export default function CollectFeePage() {
  const router = useRouter();
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [collectedBy, setCollectedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [recordStatus, setRecordStatus] = useState<RecordStatus>("PAID");
  const [mode, setMode] = useState<Mode>("pending");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const values = useMemo(() => ({
    selectedStudentId,
    studentSearch,
    amount,
    paymentMode,
    collectedBy,
    notes,
    recordStatus,
    mode,
    selectedIds
  }), [selectedStudentId, studentSearch, amount, paymentMode, collectedBy, notes, recordStatus, mode, selectedIds]);

  const { clearDraft } = useFormDraft<any>({
    keyName: "admin-fees-collect",
    values,
    onRestore: (draft) => {
      if (draft.selectedStudentId !== undefined) setSelectedStudentId(draft.selectedStudentId);
      if (draft.studentSearch !== undefined) setStudentSearch(draft.studentSearch);
      if (draft.amount !== undefined) setAmount(draft.amount);
      if (draft.paymentMode !== undefined) setPaymentMode(draft.paymentMode);
      if (draft.collectedBy !== undefined) setCollectedBy(draft.collectedBy);
      if (draft.notes !== undefined) setNotes(draft.notes);
      if (draft.recordStatus !== undefined) setRecordStatus(draft.recordStatus);
      if (draft.mode !== undefined) setMode(draft.mode);
      if (draft.selectedIds !== undefined) setSelectedIds(draft.selectedIds);
    }
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pendingRes, studentsRes] = await Promise.all([
        fetch("/api/admin/fees/collect", { credentials: "include" }),
        fetch("/api/admin/students?limit=200&status=ACTIVE", { credentials: "include" }),
      ]);

      if (pendingRes.status === 401 || studentsRes.status === 401) {
        router.push("/auth/login");
        return;
      }

      const pendingPayload = await pendingRes.json().catch(() => ({}));
      const studentsPayload = await studentsRes.json().catch(() => ({}));

      if (!pendingRes.ok) throw new Error(pendingPayload.error || "Failed to load pending fees");
      if (!studentsRes.ok) throw new Error(studentsPayload.error || "Failed to load students");

      const nextRecords: FeeRecord[] = pendingPayload.records || [];
      const nextStudents: StudentOption[] = studentsPayload.students || [];
      setRecords(nextRecords);
      setStudents(nextStudents);

      const requestedStudentId = new URLSearchParams(window.location.search).get("studentId") ?? "";
      if (requestedStudentId && nextStudents.some((student) => student.id === requestedStudentId)) {
        setSelectedStudentId(requestedStudentId);
        const studentRecordIds = nextRecords.filter((record) => record.studentId === requestedStudentId).map((record) => record.id);
        setSelectedIds(studentRecordIds);
        setMode(studentRecordIds.length > 0 ? "pending" : "manual");
      } else if (nextRecords.length === 0) {
        setMode("manual");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load fee collection data");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.includes(record.id)),
    [records, selectedIds]
  );

  const selectedPending = useMemo(
    () => selectedRecords.reduce((sum, record) => sum + record.pendingAmount, 0),
    [selectedRecords]
  );

  const pendingTotal = useMemo(
    () => records.reduce((sum, record) => sum + record.pendingAmount, 0),
    [records]
  );

  const overdueCount = useMemo(
    () => records.filter((record) => record.status === "OVERDUE").length,
    [records]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students.slice(0, 12);
    return students
      .filter((student) => {
        const name = `${student.firstName} ${student.lastName}`.toLowerCase();
        return name.includes(query) || student.studentCode.toLowerCase().includes(query) || student.phone?.includes(query);
      })
      .slice(0, 12);
  }, [studentSearch, students]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  useEffect(() => {
    if (mode !== "pending") return;
    if (selectedRecords.length === 1) {
      setAmount(selectedRecords[0].pendingAmount);
    } else if (selectedRecords.length > 1) {
      setAmount(selectedPending);
    } else {
      setAmount(0);
    }
  }, [mode, selectedRecords, selectedPending]);

  function toggleRecord(record: FeeRecord, checked: boolean) {
    setSuccess("");
    setError("");
    if (!checked) {
      setSelectedIds((current) => current.filter((id) => id !== record.id));
      return;
    }

    setMode("pending");
    setSelectedStudentId(record.studentId);
    setSelectedIds((current) => {
      const sameStudentIds = records
        .filter((item) => item.studentId === record.studentId && (current.includes(item.id) || item.id === record.id))
        .map((item) => item.id);
      return Array.from(new Set(sameStudentIds));
    });
  }

  function pickStudent(student: StudentOption) {
    setSuccess("");
    setError("");
    setSelectedStudentId(student.id);
    const studentRecordIds = records.filter((record) => record.studentId === student.id).map((record) => record.id);
    setSelectedIds(studentRecordIds);
    setMode(studentRecordIds.length > 0 ? "pending" : "manual");
    setStudentSearch(`${student.firstName} ${student.lastName}`);
    if (studentRecordIds.length === 0) {
      setAmount(student.batch?.fees ?? 0);
    }
  }

  async function generateMonthlyFees() {
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/fees/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error(payload.error || "Failed to generate monthly fees");
      setSuccess(`Generated ${payload.created ?? 0} fee records.`);
      await load();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "Failed to generate monthly fees");
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    setError("");
    setSuccess("");

    const isPendingMode = mode === "pending" && selectedIds.length > 0;
    const studentId = isPendingMode ? selectedRecords[0]?.studentId : selectedStudentId;

    if (!studentId) {
      setError("Select a student or a pending fee record first.");
      return;
    }
    if (isPendingMode && selectedRecords.some((record) => record.studentId !== studentId)) {
      setError("Collect fee for one student at a time.");
      return;
    }
    if (Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!collectedBy.trim()) {
      setError("Enter the staff member who collected or recorded this fee.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/fees/collect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          feeRecordIds: isPendingMode ? selectedIds : [],
          amount: Number(amount),
          paymentMode,
          collectedBy,
          notes,
          status: isPendingMode ? "PAID" : recordStatus,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error(payload.error || "Failed to collect fee");

      clearDraft();

      setSuccess(recordStatus === "PENDING" && !isPendingMode ? `Pending due created for ${money(Number(amount))}.` : `Collected ${money(Number(payload.collected ?? amount))} successfully.`);
      setSelectedIds([]);
      setNotes("");
      setAmount(0);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to collect fee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Fee Collection</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Collect Fee</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Collect against pending dues or record a live student payment when a monthly record has not been generated yet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={generateMonthlyFees} disabled={generating} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700 disabled:opacity-50">
              {generating ? "Generating..." : "Generate monthly fees"}
            </button>
            <Link href="/admin/fees/records" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">
              Fee records
            </Link>
            <Link href="/admin/fees/reports" className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700">
              Reports
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Pending amount" value={money(pendingTotal)} detail={`${records.length} pending records`} tone={pendingTotal > 0 ? "warn" : "good"} />
        <Metric label="Selected" value={money(selectedPending)} detail={`${selectedRecords.length} records selected`} />
        <Metric label="Overdue" value={overdueCount.toLocaleString("en-IN")} detail="Priority follow-ups" tone={overdueCount > 0 ? "bad" : "neutral"} />
        <Metric label="Students loaded" value={students.length.toLocaleString("en-IN")} detail="Available for manual collection" />
      </section>

      {(error || success) && (
        <div className={`rounded-xl px-4 py-3 text-sm ring-1 flex items-center justify-between gap-3 ${error ? "bg-rose-500/10 text-rose-100 ring-rose-400/20" : "bg-emerald-500/10 text-emerald-100 ring-emerald-400/20"}`}>
          <span>{error || success}</span>
          {error && (
            <button
              onClick={load}
              className="shrink-0 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 px-2.5 py-1 text-xs font-semibold text-rose-100 transition active:scale-95"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-2xl bg-slate-900/80 shadow-sm ring-1 ring-white/10">
          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Pending Fee Records</h2>
              <p className="mt-1 text-xs text-slate-500">Select dues for one student and collect in a single payment entry.</p>
            </div>
            <div className="flex rounded-xl bg-slate-950/50 p-1 ring-1 ring-white/10">
              <button onClick={() => setMode("pending")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === "pending" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}>
                Pending
              </button>
              <button onClick={() => setMode("manual")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${mode === "manual" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}>
                Manual
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-400">Loading live fee and student data...</div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-slate-950/40 text-left text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Select</th>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Period</th>
                    <th className="px-4 py-3 text-right font-semibold">Pending</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {records.map((record) => (
                    <tr key={record.id} className="text-slate-300 transition hover:bg-white/[0.03]">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select fee record for ${record.student.firstName} ${record.student.lastName}`}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                          checked={selectedIds.includes(record.id)}
                          onChange={(event) => toggleRecord(record, event.target.checked)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{record.student.firstName} {record.student.lastName}</div>
                        <div className="mt-1 text-xs text-slate-500">{record.student.studentCode}{record.student.phone ? ` · ${record.student.phone}` : ""}</div>
                      </td>
                      <td className="px-4 py-4">{record.batch?.name ?? "No batch"}</td>
                      <td className="px-4 py-4">{period(record.month, record.year)}</td>
                      <td className="px-4 py-4 text-right font-semibold text-white">{money(record.pendingAmount)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/20">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-xl bg-slate-950/45 p-5 ring-1 ring-white/10">
                <h3 className="text-base font-semibold text-white">No pending dues right now.</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  You can still collect a live payment by selecting a student in the panel, or generate monthly fees if this month has not been billed yet.
                </p>
              </div>
              <div className="rounded-xl bg-slate-950/45 p-5 ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next action</p>
                <button onClick={() => setMode("manual")} className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                  Select student
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl bg-slate-900/80 p-5 shadow-sm ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Payment Entry</h2>
              <p className="mt-1 text-xs text-slate-500">{mode === "pending" && selectedIds.length ? "Collect selected dues" : "Manual student collection"}</p>
            </div>
            <span className="rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
              {mode === "pending" && selectedIds.length ? "Dues" : "Ad-hoc"}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Student</span>
              <input
                value={studentSearch}
                onChange={(event) => {
                  setStudentSearch(event.target.value);
                  setMode("manual");
                }}
                placeholder="Search by name, code, or phone"
                className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-medium text-white outline-none ring-1 ring-white/10 transition placeholder:text-slate-600 focus:ring-cyan-400"
              />
            </label>

            {mode === "manual" && (
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-slate-950/45 p-2 ring-1 ring-white/10">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => pickStudent(student)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition ${selectedStudentId === student.id ? "bg-cyan-500/10 ring-1 ring-cyan-400/30" : "hover:bg-white/[0.04]"}`}
                  >
                    <span className="block text-sm font-semibold text-white">{student.firstName} {student.lastName}</span>
                    <span className="mt-1 block text-xs text-slate-500">{student.studentCode} · {student.batch?.name ?? student.standard?.name ?? "No batch mapped"}</span>
                  </button>
                )) : (
                  <p className="px-3 py-2 text-sm text-slate-500">No active students match this search.</p>
                )}
              </div>
            )}

            {selectedStudent && (
              <div className="rounded-xl bg-slate-950/45 p-3 ring-1 ring-white/10">
                <p className="text-sm font-semibold text-white">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedStudent.studentCode} · {selectedStudent.batch?.name ?? selectedStudent.standard?.name ?? "Batch not mapped"}
                </p>
              </div>
            )}

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Amount</span>
              <div className="flex items-center rounded-xl bg-slate-950 ring-1 ring-white/10 focus-within:ring-cyan-400">
                <span className="px-3 text-sm font-semibold text-slate-400">Rs.</span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-lg font-semibold text-white outline-none placeholder:text-slate-600"
                  type="number"
                  value={amount || ""}
                  onChange={(event) => setAmount(Number(event.target.value))}
                  min={1}
                  placeholder="0"
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mode</span>
                <select className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400" value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="DD">DD</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Record as</span>
                <select disabled={mode === "pending" && selectedIds.length > 0} className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400 disabled:opacity-60" value={recordStatus} onChange={(event) => setRecordStatus(event.target.value as RecordStatus)}>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending due</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Collected / recorded by</span>
              <input
                className="w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white outline-none ring-1 ring-white/10 transition placeholder:text-slate-600 focus:ring-cyan-400"
                value={collectedBy}
                onChange={(event) => setCollectedBy(event.target.value)}
                placeholder="Staff member name"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</span>
              <textarea
                className="min-h-20 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/10 transition placeholder:text-slate-600 focus:ring-cyan-400"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Receipt, cheque, transaction, or internal note"
              />
            </label>

            <div className="rounded-xl bg-slate-950/45 p-3 ring-1 ring-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Amount to submit</span>
                <span className="font-semibold text-white">{money(Number(amount) || 0)}</span>
              </div>
            </div>

            <button disabled={saving || loading} onClick={submit} className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-50">
              {saving ? "Saving..." : recordStatus === "PENDING" && mode === "manual" ? "Create pending due" : "Collect payment"}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const toneClass = {
    neutral: "text-slate-300",
    good: "text-emerald-300",
    warn: "text-amber-200",
    bad: "text-rose-200",
  }[tone];

  return (
    <div className="rounded-2xl bg-slate-900/80 p-4 shadow-sm ring-1 ring-white/10">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  );
}
