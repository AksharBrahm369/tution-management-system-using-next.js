export default function TimerBar({ secondsLeft }: { secondsLeft: number }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return (
    <div className="rounded-lg border bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900">
      Time Left: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
