import React, { useMemo, useState } from "react";
import { CreditCard, IndianRupee, Clock, CheckCircle, AlertCircle, Calendar, PlusCircle, Edit2, Check, X, FileText, User } from "lucide-react";
import { StudentProfileData } from "../types";

interface FeesTabProps {
  student: StudentProfileData;
  onChanged?: () => void;
}

const paymentModes = ["CASH", "UPI", "ONLINE", "BANK_TRANSFER", "CHEQUE", "DD"];

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";
}

function formatPeriod(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function statusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "PAID":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
    case "OVERDUE":
      return "bg-rose-500/10 text-rose-705 dark:text-rose-400 border border-rose-500/20";
    case "PARTIAL":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
    case "WAIVED":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
    default:
      return "bg-blue-505/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
  }
}

const FeesTab: React.FC<FeesTabProps> = ({ student, onChanged }) => {
  const pendingRecords = useMemo(
    () =>
      student.feeRecords.filter(
        (record) =>
          (record.pendingAmount > 0 ||
            record.status === "PENDING" ||
            record.status === "PARTIAL" ||
            record.status === "OVERDUE") &&
          record.status !== "WAIVED" &&
          record.status !== "PAID" &&
          record.status !== "REFUNDED"
      ),
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
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

  async function saveRecordAmount(recordId: string) {
    if (editAmount < 0) {
      alert("Amount cannot be negative.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/fees/records/${recordId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: editAmount }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Failed to update record amount");
      
      setEditingRecordId(null);
      onChanged?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update record amount");
    } finally {
      setSaving(false);
    }
  }

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
  const pendingFees = student.pendingFees;
  const collectionRate = totalBilled > 0 ? Math.round((student.feesPaid / totalBilled) * 100) : 100;

  function toggleRecord(recordId: string, checked: boolean) {
    const nextIds = checked ? [...selectedIds, recordId] : selectedIds.filter((id) => id !== recordId);
    setSelectedIds(nextIds);

    const nextPending = pendingRecords
      .filter((record) => nextIds.includes(record.id))
      .reduce((sum, record) => sum + record.pendingAmount, 0);
    setAmount(nextPending);
  }

  async function collectPayment(actionStatus: "PAID" | "PENDING" = "PAID") {
    if (amount < 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    if (validSelectedIds.length === 0 && amount <= 0) {
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
      
      {/* SECTION 6: FINANCIAL WIDGET (FEE HEALTH) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fee Health
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Current financial standing, invoices, and payments log.
            </p>
          </div>
          
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-950/20 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-850">
            <Calendar size={13} className="text-slate-400" />
            <span>Last payment: </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {lastPayment ? `${formatCurrency(lastPayment.amount)} on ${formatDate(lastPayment.paidAt)}` : "None"}
            </span>
          </div>
        </div>

        {/* Visual Analytics */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Billed */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <CreditCard size={12} className="text-blue-500" /> Total Billed
            </span>
            <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
              {formatCurrency(totalBilled)}
            </p>
            <p className="mt-1 text-[10px] text-slate-455 dark:text-slate-500 font-semibold">
              Accumulated billing invoices
            </p>
          </div>

          {/* Paid Amount */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <CheckCircle size={12} className="text-emerald-500" /> Total Paid
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-450">
                {formatCurrency(student.feesPaid)}
              </p>
              <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                Cleared
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-455 dark:text-slate-500 font-semibold">
              Received collections
            </p>
          </div>

          {/* Pending Fees */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <AlertCircle size={12} className="text-amber-500" /> Pending Dues
            </span>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-500">
                {formatCurrency(pendingFees)}
              </p>
              {pendingFees > 0 && (
                <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                  Dues Active
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-455 dark:text-slate-500 font-semibold">
              Due across {pendingRecords.length} invoices
            </p>
          </div>

          {/* Collection progress */}
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/60 dark:bg-slate-950/20 flex flex-col justify-between">
            <div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Clock size={12} className="text-slate-500" /> Collection Ratio
              </span>
              <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
                {collectionRate}%
              </p>
            </div>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Grid: Records List + Collection Form */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        
        {/* Fee Records list */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 pb-2 dark:border-slate-800/80">
            Billing Records
          </h4>

          <div className="overflow-x-auto">
            {student.feeRecords.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No billing records generated.</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Record a pending fee or collection using the sidebar.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2.5 pr-2 w-8">Select</th>
                    <th className="py-2.5 px-2">Receipt</th>
                    <th className="py-2.5 px-2">Batch</th>
                    <th className="py-2.5 px-2">Period</th>
                    <th className="py-2.5 px-2">Due Date</th>
                    <th className="py-2.5 px-2">Billed Amount</th>
                    <th className="py-2.5 px-2">Paid</th>
                    <th className="py-2.5 px-2">Pending</th>
                    <th className="py-2.5 pl-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {student.feeRecords.map((record) => {
                    const isPending = pendingRecords.some((r) => r.id === record.id);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 transition">
                        <td className="py-3 pr-2">
                          <input
                            aria-label={`Select record ${record.receiptNumber}`}
                            type="checkbox"
                            className="cursor-pointer disabled:cursor-not-allowed h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30"
                            disabled={!isPending || saving}
                            checked={selectedIds.includes(record.id)}
                            onChange={(event) => toggleRecord(record.id, event.target.checked)}
                          />
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-900 dark:text-white">
                          {record.receiptNumber}
                        </td>
                        <td className="py-3 px-2 text-slate-600 dark:text-slate-400 font-medium">{record.batch?.name ?? "-"}</td>
                        <td className="py-3 px-2 text-slate-650 dark:text-slate-350">{formatPeriod(record.month, record.year)}</td>
                        <td className="py-3 px-2 text-slate-455 dark:text-slate-500 font-semibold">{formatDate(record.dueDate)}</td>
                        <td className="py-3 px-2">
                          {editingRecordId === record.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                className="w-16 rounded border border-slate-300 px-1 py-0.5 text-xs font-semibold dark:bg-slate-950 dark:border-slate-700"
                                value={editAmount}
                                onChange={(e) => setEditAmount(Number(e.target.value))}
                                min={record.paidAmount}
                              />
                              <button
                                onClick={() => saveRecordAmount(record.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                                title="Save"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={() => setEditingRecordId(null)}
                                className="text-xs text-slate-400 hover:text-slate-650 cursor-pointer"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-900 dark:text-white font-bold">
                              <span>{formatCurrency(record.totalAmount)}</span>
                              {record.status !== "WAIVED" && record.status !== "REFUNDED" && (
                                <button
                                  onClick={() => {
                                    setEditingRecordId(record.id);
                                    setEditAmount(record.totalAmount);
                                  }}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  title="Edit Fee Amount"
                                >
                                  <Edit2 size={10} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-emerald-650 font-bold">{formatCurrency(record.paidAmount)}</td>
                        <td className="py-3 px-2 text-amber-650 font-bold">{formatCurrency(record.pendingAmount)}</td>
                        <td className="py-3 pl-2 text-right">
                          <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusBadgeClass(record.status)}`}>
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

        {/* Collect Payment Sidebar */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900/60 h-fit">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 pb-2 dark:border-slate-800/80">
            Collect / Record Dues
          </h4>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Amount</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-300">₹</span>
                <input
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm font-bold text-slate-950 caret-blue-500 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  max={selectedPending || undefined}
                  min={0}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Mode</label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={paymentMode}
                onChange={(event) => setPaymentMode(event.target.value)}
              >
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>{mode.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Collected / Recorded By</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><User size={13} /></span>
                <input
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={collectedBy}
                  onChange={(event) => setCollectedBy(event.target.value)}
                  placeholder="Staff member name"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Notes</label>
              <textarea
                className="min-h-16 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes or check/transaction reference"
              />
            </div>

            {validSelectedIds.length > 0 && (
              <div className="rounded-md bg-blue-500/5 p-2.5 text-[11px] text-blue-700 dark:text-blue-400 border border-blue-500/10 font-medium">
                Selected dues: <span className="font-bold">{formatCurrency(selectedPending)}</span>
              </div>
            )}

            {pendingRecords.length === 0 && (
              <div className="rounded-md bg-amber-500/5 border border-amber-500/10 p-2.5 text-[10px] text-amber-705 dark:text-amber-400 font-medium leading-relaxed">
                No fee records linked. Record a pending fee to draft a custom invoice, or directly collect a quick payment.
              </div>
            )}

            {pendingRecords.length === 0 ? (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="w-full rounded-md bg-amber-600 hover:bg-amber-700 py-2 text-xs font-bold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition"
                  disabled={saving || amount <= 0 || !collectedBy.trim()}
                  onClick={() => collectPayment("PENDING")}
                >
                  {saving ? "Saving..." : "Record Pending Fee"}
                </button>
                <button
                  type="button"
                  className="w-full rounded-md bg-blue-600 hover:bg-blue-700 py-2 text-xs font-bold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition"
                  disabled={saving || amount <= 0 || !collectedBy.trim()}
                  onClick={() => collectPayment("PAID")}
                >
                  {saving ? "Saving..." : "Collect Payment (Paid)"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="w-full rounded-md bg-blue-600 hover:bg-blue-700 py-2 text-xs font-bold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition pt-1"
                disabled={saving || (validSelectedIds.length === 0 && amount <= 0) || amount < 0 || !collectedBy.trim()}
                onClick={() => collectPayment("PAID")}
              >
                {saving ? "Saving..." : "Collect Payment"}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* SECTION 6: PAYMENT HISTORY PREVIEW */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-850 dark:bg-slate-900/60">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 pb-2 dark:border-slate-800/80">
          Payment History Log
        </h4>
        
        {payments.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500 font-semibold">
            No payments collected yet.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-150 p-3 text-xs dark:border-slate-800 hover:bg-slate-50/20 transition">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">
                    <Check size={13} />
                  </div>
                  <div>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{payment.paymentNumber}</div>
                    <div className="text-[10px] text-slate-455 dark:text-slate-500 font-semibold">
                      {payment.batchName} · {payment.period} · <span className="uppercase">{payment.paymentMode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-right">
                  <div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(payment.amount)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(payment.paidAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</div>
                  </div>
                  {payment.notes && (
                    <div className="hidden sm:block max-w-[200px] truncate text-[10px] italic text-slate-400 text-left border-l border-slate-200 pl-3 dark:border-slate-800" title={payment.notes}>
                      "{payment.notes}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default FeesTab;
