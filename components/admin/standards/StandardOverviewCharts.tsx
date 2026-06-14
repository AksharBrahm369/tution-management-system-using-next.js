'use client';

interface StandardOverviewChartsProps {
  attendance: {
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
  studentCategories: {
    topper: number;
    good: number;
    average: number;
    weak: number;
  };
  fees: {
    collected: number;
    pending: number;
    total: number;
  };
}

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString('en-IN')}`;
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default function StandardOverviewCharts({ attendance, studentCategories, fees }: StandardOverviewChartsProps) {
  const totalAttendance = attendance.present + attendance.absent + attendance.late + attendance.leave;
  const attendanceRate = percent(attendance.present + attendance.late, totalAttendance);
  const totalStudents = studentCategories.topper + studentCategories.good + studentCategories.average + studentCategories.weak;
  const collectionRate = percent(fees.collected, fees.total);

  const categoryRows = [
    { label: 'Topper', value: studentCategories.topper, tone: 'bg-sky-400' },
    { label: 'Good', value: studentCategories.good, tone: 'bg-emerald-400' },
    { label: 'Average', value: studentCategories.average, tone: 'bg-amber-300' },
    { label: 'Weak', value: studentCategories.weak, tone: 'bg-rose-300' },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr_1fr]">
      <section className="rounded-xl bg-slate-900 p-4 shadow-sm ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Attendance Health</h2>
            <p className="mt-1 text-xs text-slate-500">Present, absent, late, and leave records.</p>
          </div>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${attendanceRate >= 90 ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20' : 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20'}`}>
            {attendanceRate}% rate
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950 ring-1 ring-white/10">
          <div className="h-full bg-emerald-400" style={{ width: `${attendanceRate}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatusStat label="Present" value={attendance.present} tone="text-emerald-300" />
          <StatusStat label="Absent" value={attendance.absent} tone="text-rose-300" />
          <StatusStat label="Late" value={attendance.late} tone="text-amber-200" />
          <StatusStat label="Leave" value={attendance.leave} tone="text-sky-300" />
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 p-4 shadow-sm ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Student Mix</h2>
            <p className="mt-1 text-xs text-slate-500">Academic category distribution.</p>
          </div>
          <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-300 ring-1 ring-white/10">
            {totalStudents} classified
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {categoryRows.map((row) => {
            const width = percent(row.value, totalStudents);
            return (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium text-slate-300">{row.label}</span>
                  <span className="text-slate-500">{row.value} students</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-950 ring-1 ring-white/10">
                  <div className={`h-full ${row.tone}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl bg-slate-900 p-4 shadow-sm ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Collection Health</h2>
            <p className="mt-1 text-xs text-slate-500">Billed versus received for this standard.</p>
          </div>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${fees.pending > 0 ? 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20' : 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20'}`}>
            {collectionRate}% collected
          </span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950 ring-1 ring-white/10">
          <div className="h-full bg-emerald-400" style={{ width: `${collectionRate}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatusStat label="Billed" value={money(fees.total)} />
          <StatusStat label="Collected" value={money(fees.collected)} tone="text-emerald-300" />
          <StatusStat label="Pending" value={money(fees.pending)} tone={fees.pending > 0 ? 'text-amber-200' : 'text-emerald-300'} />
        </div>
      </section>
    </div>
  );
}

function StatusStat({ label, value, tone = 'text-white' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-950/60 px-3 py-2 ring-1 ring-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
