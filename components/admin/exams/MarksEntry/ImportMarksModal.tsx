export default function ImportMarksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Import Marks (Excel)</h3>
        <p className="mt-2 text-sm text-slate-500">Use the template endpoint to download and upload marks in bulk.</p>
        <div className="mt-4 flex gap-2">
          <a href="#" className="rounded border px-3 py-2 text-sm">Download Template</a>
          <input type="file" accept=".xlsx,.xls" className="text-sm" />
        </div>
        <div className="mt-6 flex justify-end">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
