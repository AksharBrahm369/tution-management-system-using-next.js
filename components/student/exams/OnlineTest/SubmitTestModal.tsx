export default function SubmitTestModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-slate-900">
        <h3 className="text-lg font-semibold">Submit Test</h3>
        <p className="mt-2 text-sm text-slate-500">Are you sure you want to submit your answers?</p>
        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-4 py-2" onClick={onClose}>Cancel</button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={onSubmit}>Submit</button>
        </div>
      </div>
    </div>
  );
}
