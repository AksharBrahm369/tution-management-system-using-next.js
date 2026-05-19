"use client";

import { useState } from "react";

export default function PublishResultsModal({ onClose, onPublish }: { onClose: () => void; onPublish: (notifyParents: boolean) => void }) {
  const [notify, setNotify] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Publish Results</h3>
        <p className="mt-2 text-sm text-slate-500">Once published, students and parents can view results.</p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Notify parents now
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Cancel</button>
          <button className="rounded-lg bg-green-600 px-4 py-2 text-white" onClick={() => onPublish(notify)}>Publish</button>
        </div>
      </div>
    </div>
  );
}
