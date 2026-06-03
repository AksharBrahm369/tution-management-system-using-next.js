"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  student: {
    firstName: string;
    lastName: string;
    studentCode: string;
    phone?: string | null;
  };
  batch: {
    name: string;
    code: string;
  };
};

export default function CollectFeePage() {
  const router = useRouter();
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [collectedBy, setCollectedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const selectedRecords = useMemo(
    () => records.filter((record) => selectedIds.includes(record.id)),
    [records, selectedIds]
  );

  const selectedPending = useMemo(
    () => selectedRecords.reduce((sum, record) => sum + record.pendingAmount, 0),
    [selectedRecords]
  );

  useEffect(() => {
    if (selectedRecords.length === 1) {
      setAmount(selectedRecords[0].pendingAmount);
    } else if (selectedRecords.length > 1) {
      setAmount(selectedPending);
    }
  }, [selectedRecords, selectedPending]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fees/collect", { credentials: "include" });
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error(payload.error || "Failed to load pending fees");
      setRecords(payload.records || []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to load pending fees");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!selectedIds.length) {
      alert("Select at least one fee record");
      return;
    }
    if (!collectedBy.trim()) {
      alert("Enter collected by name");
      return;
    }

    const selectedStudentId = selectedRecords[0]?.studentId;
    if (!selectedStudentId) {
      alert("Could not determine student for the selected fee record");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/fees/collect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          feeRecordIds: selectedIds,
          amount: Number(amount),
          paymentMode,
          collectedBy,
          notes,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      if (!res.ok) throw new Error(payload.error || "Failed to collect fee");

      alert(`Collected ₹${payload.collected} successfully`);
      setSelectedIds([]);
      setNotes("");
      await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to collect fee");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Collect Fee</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Collect pending fee records and create payment entries.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        {loading ? (
          <div>Loading pending records...</div>
        ) : records.length === 0 ? (
          <div>No pending fees found.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="space-y-1 text-sm">
                <span className="block text-slate-500">Amount</span>
                <input className="w-full rounded-lg border px-3 py-2" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="block text-slate-500">Payment Mode</span>
                <select className="w-full rounded-lg border px-3 py-2" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="DD">DD</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="block text-slate-500">Collected By</span>
                <input className="w-full rounded-lg border px-3 py-2" value={collectedBy} onChange={(e) => setCollectedBy(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="block text-slate-500">Notes</span>
                <input className="w-full rounded-lg border px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-3 text-left">Select</th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-left">Period</th>
                    <th className="px-4 py-3 text-left">Pending</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="cursor-pointer disabled:cursor-not-allowed h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedIds.includes(record.id)}
                          onChange={(e) => {
                            setSelectedIds((current) =>
                              e.target.checked ? [...current, record.id] : current.filter((id) => id !== record.id)
                            );
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{record.student.firstName} {record.student.lastName}</div>
                        <div className="text-xs text-slate-500">{record.student.studentCode}</div>
                      </td>
                      <td className="px-4 py-3">{record.batch?.name || "-"}</td>
                      <td className="px-4 py-3">{record.month}/{record.year}</td>
                      <td className="px-4 py-3">₹{record.pendingAmount.toFixed(2)}</td>
                      <td className="px-4 py-3">{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-500">Selected pending: ₹{selectedPending.toFixed(2)}</div>
              <button disabled={saving} onClick={submit} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                {saving ? "Saving..." : "Collect Payment"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}