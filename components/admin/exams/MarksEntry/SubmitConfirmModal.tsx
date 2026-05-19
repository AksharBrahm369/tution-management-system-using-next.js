"use client";

import { useState } from "react";

export default function SubmitConfirmModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (opts: { calculateRanks: boolean; publishNow: boolean; notifyParents: boolean }) => void;
  onClose: () => void;
}) {
  const [calculateRanks, setCalculateRanks] = useState(true);
  const [publishNow, setPublishNow] = useState(false);
  const [notifyParents, setNotifyParents] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Confirm Submit Marks</h3>
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={calculateRanks} onChange={(e) => setCalculateRanks(e.target.checked)} /> Auto-calculate ranks</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} /> Publish results now</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={notifyParents} onChange={(e) => setNotifyParents(e.target.checked)} /> Notify parents</label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Cancel</button>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            onClick={() => onConfirm({ calculateRanks, publishNow, notifyParents })}
          >
            Confirm Submit
          </button>
        </div>
      </div>
    </div>
  );
}
