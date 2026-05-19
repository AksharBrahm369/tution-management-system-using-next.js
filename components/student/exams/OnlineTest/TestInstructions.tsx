export default function TestInstructions({ title, duration, onStart }: { title: string; duration: number; onStart: () => void }) {
  return (
    <div className="rounded-xl border p-6 dark:border-slate-700">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">Duration: {duration} minutes</p>
      <ul className="mt-3 list-disc pl-5 text-sm">
        <li>Do not switch tabs repeatedly.</li>
        <li>Test auto-submits when time ends.</li>
        <li>Only one attempt is allowed.</li>
      </ul>
      <button className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white" onClick={onStart}>Start Test</button>
    </div>
  );
}
