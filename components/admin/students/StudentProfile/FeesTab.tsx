import React, { useMemo, useState } from "react";
import { StudentProfileData } from "../types";

interface FeesTabProps {
  student: StudentProfileData;
  onChanged?: () => void;
}

const paymentModes = ["CASH", "UPI", "ONLINE", "BANK_TRANSFER", "CHEQUE", "DD"];

function formatCurrency(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-IN") : "N/A";
}

function formatPeriod(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

const FeesTab: React.FC<FeesTabProps> = ({ student, onChanged }) => {
  const pendingRecords = useMemo(
    () => student.feeRecords.filter((record) => record.pendingAmount > 0 && record.status !== "WAIVED"),
    [student.feeRecords]
  );

  const payments = useMemo(
    () =>
      student.feeRecords
        .flatMap((record) =>
          record.payments.map((payment) => ({
            ...payment,
            batchName: record.batch?.name ?? "Unassigned batch",
            period: formatPeriod(record.month, record.year),
          }))
        )
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()),
    [student.feeRecords]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(pendingRecords[0] ? [pendingRecords[0].id] : []);
  const [amount, setAmount] = useState(pendingRecords[0]?.pendingAmount ?? 0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [collectedBy, setCollectedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedRecords = useMemo(
    () => pendingRecords.filter((record) => selectedIds.includes(record.id)),
    [pendingRecords, selectedIds]
  );
  const validSelectedIds = useMemo(() => selectedRecords.map((record) => record.id), [selectedRecords]);

  const selectedPending = useMemo(
    () => selectedRecords.reduce((sum, record) => sum + record.pendingAmount, 0),
    [selectedRecords]
  );

  const totalBilled = useMemo(
    () => student.feeRecords.reduce((sum, record) => sum + record.totalAmount, 0),
    [student.feeRecords]
  );

  const lastPayment = payments[0];

  function toggleRecord(recordId: string, checked: boolean) {
    const nextIds = checked ? [...selectedIds, recordId] : selectedIds.filter((id) => id !== recordId);
    setSelectedIds(nextIds);

    const nextPending = pendingRecords
      .filter((record) => nextIds.includes(record.id))
      .reduce((sum, record) => sum + record.pendingAmount, 0);
    setAmount(nextPending);
  }

  async function collectPayment(actionStatus: "PAID" | "PENDING" = "PAID") {
    if (amount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    if (!collectedBy.trim()) {
      alert(
        actionStatus === "PENDING" && pendingRecords.length === 0
          ? "Enter the name of who recorded this pending fee."
          : "Enter the name of who collected this payment."
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/fees/collect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          feeRecordIds: validSelectedIds,
          amount: Number(amount),
          paymentMode,
          collectedBy: collectedBy.trim(),
          notes: notes.trim() || undefined,
          status: validSelectedIds.length === 0 ? actionStatus : "PAID",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to collect payment");

      if (actionStatus === "PENDING" && pendingRecords.length === 0) {
        alert(`Recorded pending fee of ${formatCurrency(amount)} successfully.`);
      } else {
        alert(`Collected ${formatCurrency(payload.collected || amount)} successfully.`);
      }
      setSelectedIds([]);
      setAmount(0);
      setNotes("");
      onChanged?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to collect payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fee Management</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Live fee records, dues, and payments for this student.</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800">
            Last payment: <span className="font-semibold text-slate-900 dark:text-white">{lastPayment ? formatDate(lastPayment.paidAt) : "N/A"}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500">Total billed</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalBilled)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500">Total paid</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(student.feesPaid)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500">Pending amount</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(student.pendingFees)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs uppercase text-slate-500">Pending records</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{pendingRecords.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h4 className="font-semibold text-slate-900 dark:text-white">Fee Records</h4>
          <div className="mt-4 overflow-x-auto">
            {student.feeRecords.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">No fee records found for this student.</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">You can still collect a payment using the form on the right.</p>
              </div>
            ) : (
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Select</th>
                  <th className="py-2 pr-4">Receipt</th>
                  <th className="py-2 pr-4">Batch</th>
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Due date</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Paid</th>
                  <th className="py-2 pr-4">Pending</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {student.feeRecords.map((record) => {
                  const isPending = record.pendingAmount > 0 && record.status !== "WAIVED";
                  return (
                    <tr key={record.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 pr-4">
                        <input
                          aria-label={`Select ${record.receiptNumber}`}
                          type="checkbox"
                          disabled={!isPending || saving}
                          checked={selectedIds.includes(record.id)}
                          onChange={(event) => toggleRecord(record.id, event.target.checked)}
                        />
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">{record.receiptNumber}</td>
                      <td className="py-3 pr-4">{record.batch?.name ?? "-"}</td>
                      <td className="py-3 pr-4">{formatPeriod(record.month, record.year)}</td>
                      <td className="py-3 pr-4">{formatDate(record.dueDate)}</td>
                      <td className="py-3 pr-4">{formatCurrency(record.totalAmount)}</td>
                      <td className="py-3 pr-4">{formatCurrency(record.paidAmount)}</td>
                      <td className="py-3 pr-4">{formatCurrency(record.pendingAmount)}</td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <h4 className="font-semibold text-slate-900 dark:text-white">Collect Payment</h4>
          <div className="mt-4 space-y-4">
            <label className="block text-sm">
              <span className="text-slate-500">Amount</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                max={selectedPending || undefined}
                min={0}
                type="number"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-500">Payment mode</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={paymentMode}
                onChange={(event) => setPaymentMode(event.target.value)}
              >
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>{mode.replace("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-500">Collected / Recorded by</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={collectedBy}
                onChange={(event) => setCollectedBy(event.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-500">Notes</span>
              <textarea
                className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
            {validSelectedIds.length > 0 && (
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Selected pending: <span className="font-semibold">{formatCurrency(selectedPending)}</span>
              </div>
            )}
            {pendingRecords.length === 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                No fee records linked — use "Record Pending Fee" to add a new unpaid fee, or "Collect Payment" to add a paid payment.
              </div>
            )}
            {pendingRecords.length === 0 ? (
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  disabled={saving || amount <= 0 || !collectedBy.trim()}
                  onClick={() => collectPayment("PENDING")}
                >
                  {saving ? "Saving..." : "Record Pending Fee"}
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  disabled={saving || amount <= 0 || !collectedBy.trim()}
                  onClick={() => collectPayment("PAID")}
                >
                  {saving ? "Saving..." : "Collect Payment (Paid)"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                disabled={saving || amount <= 0 || !collectedBy.trim()}
                onClick={() => collectPayment("PAID")}
              >
                {saving ? "Saving..." : "Collect Payment"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h4 className="font-semibold text-slate-900 dark:text-white">Payment History</h4>
        <div className="mt-4 space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{payment.paymentNumber}</div>
                <div className="text-xs text-slate-500">{payment.batchName} · {payment.period} · {payment.paymentMode}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</div>
                <div className="text-xs text-slate-500">{new Date(payment.paidAt).toLocaleString("en-IN")}</div>
              </div>
            </div>
          ))}
          {payments.length === 0 && <div className="text-sm text-slate-500">No payments recorded yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default FeesTab;
