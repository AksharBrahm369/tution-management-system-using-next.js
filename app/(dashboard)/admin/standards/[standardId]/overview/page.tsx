import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  IndianRupee,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";
import StandardOverviewCharts from "@/components/admin/standards/StandardOverviewCharts";

export const dynamic = "force-dynamic";

const categoryLabels = {
  topper: "Topper",
  good: "Good",
  average: "Average",
  weak: "Weak",
};

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export default async function StandardOverviewPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    studentStatsGroup,
    enrolledStudents,
    batches,
    teachers,
    attendanceTotals,
    todayAttendance,
    feeRecordsAgg,
    feeStatusCounts,
    upcomingExams,
    latestPayments,
  ] = await Promise.all([
    prisma.student.count({ where: { standardId } }),
    prisma.student.count({ where: { standardId, status: "ACTIVE" } }),
    prisma.student.count({ where: { standardId, status: { not: "ACTIVE" } } }),
    prisma.student.groupBy({
      by: ["category"],
      where: { standardId },
      _count: { _all: true },
    }),
    prisma.student.findMany({
      where: { standardId },
      select: {
        id: true,
        studentCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        category: true,
        batchEnrollments: {
          where: { isActive: true },
          take: 1,
          select: { batch: { select: { name: true } } },
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 12,
          select: { status: true },
        },
        feeRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { pendingAmount: true, paidAmount: true, status: true },
        },
      },
      orderBy: [{ status: "asc" }, { firstName: "asc" }],
      take: 12,
    }),
    prisma.batch.findMany({
      where: { standardId },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        subject: { select: { name: true } },
        enrollments: { where: { isActive: true }, select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.teacher.findMany({
      where: {
        OR: [
          { standardSubjects: { some: { standardId } } },
          { batches: { some: { standardId } } },
        ],
      },
      select: {
        id: true,
        teacherCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        qualification: true,
        specialization: true,
        batches: { where: { standardId }, select: { id: true } },
      },
      orderBy: { firstName: "asc" },
      take: 8,
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { student: { standardId } },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        student: { standardId },
        date: { gte: todayStart, lt: tomorrowStart },
      },
      _count: { _all: true },
    }),
    prisma.feeRecord.aggregate({
      where: { OR: [{ student: { standardId } }, { batch: { standardId } }] },
      _sum: { totalAmount: true, paidAmount: true, pendingAmount: true },
      _count: { _all: true },
    }),
    prisma.feeRecord.groupBy({
      by: ["status"],
      where: { OR: [{ student: { standardId } }, { batch: { standardId } }] },
      _count: { _all: true },
    }),
    prisma.exam.findMany({
      where: {
        OR: [{ standardId }, { batch: { standardId } }],
        examDate: { gte: new Date() },
      },
      include: {
        batch: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: { examDate: "asc" },
      take: 6,
    }),
    prisma.feePayment.findMany({
      where: {
        feeRecord: { OR: [{ student: { standardId } }, { batch: { standardId } }] },
      },
      include: {
        feeRecord: {
          select: {
            student: { select: { firstName: true, lastName: true, studentCode: true } },
          },
        },
      },
      orderBy: { paidAt: "desc" },
      take: 5,
    }),
  ]);

  const categories = { topper: 0, good: 0, average: 0, weak: 0 };
  studentStatsGroup.forEach((group) => {
    const key = group.category?.toLowerCase() as keyof typeof categories;
    if (key in categories) categories[key] = group._count._all;
  });

  const attendanceByStatus = {
    present: attendanceTotals.find((item) => item.status === "PRESENT")?._count._all ?? 0,
    absent: attendanceTotals.find((item) => item.status === "ABSENT")?._count._all ?? 0,
    late: attendanceTotals.find((item) => item.status === "LATE")?._count._all ?? 0,
    leave: attendanceTotals.find((item) => item.status === "ON_LEAVE")?._count._all ?? 0,
  };
  const todayByStatus = {
    present: todayAttendance.find((item) => item.status === "PRESENT")?._count._all ?? 0,
    absent: todayAttendance.find((item) => item.status === "ABSENT")?._count._all ?? 0,
    late: todayAttendance.find((item) => item.status === "LATE")?._count._all ?? 0,
    leave: todayAttendance.find((item) => item.status === "ON_LEAVE")?._count._all ?? 0,
  };
  const todayMarked = todayByStatus.present + todayByStatus.absent + todayByStatus.late + todayByStatus.leave;

  const totalAttendance = attendanceByStatus.present + attendanceByStatus.absent + attendanceByStatus.late + attendanceByStatus.leave;
  const attendanceRate = percent(attendanceByStatus.present + attendanceByStatus.late, totalAttendance);
  const totalFees = feeRecordsAgg._sum.totalAmount ?? 0;
  const paidFees = feeRecordsAgg._sum.paidAmount ?? 0;
  const pendingFees = feeRecordsAgg._sum.pendingAmount ?? 0;
  const collectionRate = percent(paidFees, totalFees);
  const pendingFeeRecords = feeStatusCounts.filter((item) => item.status === "PENDING" || item.status === "PARTIAL" || item.status === "OVERDUE").reduce((sum, item) => sum + item._count._all, 0);
  const studentsPerBatch = batches.length > 0 ? Math.round((activeStudents / batches.length) * 10) / 10 : 0;
  const ownerAttention = pendingFees > 0
    ? `${money(pendingFees)} pending across ${pendingFeeRecords} fee records`
    : attendanceRate > 0 && attendanceRate < 90
      ? `Attendance is ${attendanceRate}%, below the 90% operating target`
      : upcomingExams.length === 0
        ? "No upcoming exams scheduled for this standard"
        : "Standard is operationally stable";

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-slate-900 p-4 shadow-sm ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href={`/admin/standards/${standardId}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {standard.name}
            </Link>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Standard Overview</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{standard.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              Live operating view for admissions, attendance, batches, faculty, exams, and collections.
            </p>
          </div>

          <div className="grid gap-2 text-xs sm:grid-cols-3 lg:min-w-[440px]">
            <StatusCell label="Students / Batch" value={studentsPerBatch || "-"} />
            <StatusCell label="Today Marked" value={todayMarked ? `${todayMarked} records` : "Not marked"} tone={todayMarked ? "emerald" : "amber"} />
            <StatusCell label="Owner Attention" value={pendingFees > 0 ? "Fees" : attendanceRate < 90 && attendanceRate > 0 ? "Attendance" : "Stable"} tone={pendingFees > 0 || (attendanceRate < 90 && attendanceRate > 0) ? "amber" : "emerald"} />
          </div>
        </div>
      </section>

      <section className="grid auto-rows-[124px] gap-3 xl:grid-cols-[minmax(300px,1.15fr)_repeat(4,minmax(136px,1fr))]">
        <div className="flex h-full min-w-0 flex-col justify-between rounded-xl bg-slate-900 p-3 shadow-sm ring-1 ring-white/10">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Decision first</p>
              <h2 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white">{ownerAttention}</h2>
            </div>
            <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${pendingFees > 0 ? "bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/20" : "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20"}`}>
              {pendingFees > 0 ? "Action needed" : "On track"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link href={`/admin/standards/${standardId}/fees`} className="flex h-8 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold leading-none text-slate-950 transition hover:bg-slate-200">
              Review fees
            </Link>
            <Link href={`/admin/standards/${standardId}/attendance`} className="flex h-8 items-center justify-center rounded-lg bg-slate-950 px-3 text-xs font-semibold leading-none text-slate-200 ring-1 ring-white/10 transition hover:bg-white/[0.04]">
              Attendance
            </Link>
          </div>
        </div>

        <Metric label="Students" value={totalStudents} detail={`${activeStudents} active, ${inactiveStudents} inactive`} icon={<Users className="h-4 w-4" />} />
        <Metric label="Batches" value={batches.length} detail={`${studentsPerBatch || 0} active students each`} icon={<BookOpen className="h-4 w-4" />} />
        <Metric label="Attendance" value={`${attendanceRate}%`} detail={`${totalAttendance} records tracked`} icon={<CheckCircle2 className="h-4 w-4" />} tone={attendanceRate >= 90 ? "good" : "warn"} />
        <Metric label="Pending fees" value={money(pendingFees)} detail={`${collectionRate}% collected`} icon={<IndianRupee className="h-4 w-4" />} tone={pendingFees > 0 ? "warn" : "good"} />
      </section>

      <StandardOverviewCharts
        attendance={attendanceByStatus}
        studentCategories={categories}
        fees={{ collected: paidFees, pending: pendingFees, total: totalFees }}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Panel
            title="Batch Workload"
            detail={`${batches.length} active study groups in this standard`}
            href={`/admin/standards/${standardId}/batches`}
            action="Manage batches"
          >
            {batches.length > 0 ? (
              <div className="divide-y divide-white/10">
                {batches.map((batch) => {
                  const strengthRate = batch.maxStrength > 0 ? percent(batch.enrollments.length, batch.maxStrength) : 0;
                  return (
                    <div key={batch.id} className="grid gap-3 py-3 text-sm text-slate-300 lg:grid-cols-[minmax(0,1.2fr)_1fr_120px] lg:items-center">
                      <div>
                        <p className="font-semibold text-white">{batch.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{batch.subject?.name ?? "No subject"} · {batch.teacher ? `${batch.teacher.firstName} ${batch.teacher.lastName}` : "No teacher"}</p>
                      </div>
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-950 ring-1 ring-white/10">
                          <div className="h-full bg-cyan-400" style={{ width: `${Math.min(strengthRate, 100)}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{batch.enrollments.length}/{batch.maxStrength} seats · {batch.startTime}-{batch.endTime}</p>
                      </div>
                      <Link href={`/admin/standards/${standardId}/batches/${batch.id}`} className="text-right text-xs font-semibold text-cyan-300 transition hover:text-cyan-200">
                        Open <ArrowUpRight className="inline h-3 w-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <UsefulEmpty title="No batches configured" detail="Create batches to make attendance, exams, and fee generation actionable." href={`/admin/standards/${standardId}/batches/add`} action="Add batch" />
            )}
          </Panel>

          <Panel
            title="Student Operating List"
            detail={`Latest ${enrolledStudents.length} students with attendance and fee signals`}
            href={`/admin/standards/${standardId}/students`}
            action="View students"
          >
            {enrolledStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="py-3 pr-4 font-semibold">Student</th>
                      <th className="px-4 py-3 font-semibold">Batch</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 text-right font-semibold">Attendance</th>
                      <th className="py-3 pl-4 text-right font-semibold">Fee status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {enrolledStudents.map((student) => {
                      const presentRecords = student.attendance.filter((record) => record.status === "PRESENT" || record.status === "LATE").length;
                      const studentAttendanceRate = percent(presentRecords, student.attendance.length);
                      const latestFee = student.feeRecords[0];
                      return (
                        <tr key={student.id} className="text-slate-300">
                          <td className="py-3 pr-4">
                            <Link href={`/admin/standards/${standardId}/students/${student.id}`} className="font-semibold text-white transition hover:text-cyan-200">
                              {student.firstName} {student.lastName}
                            </Link>
                            <p className="mt-1 text-xs text-slate-500">{student.studentCode} · {student.phone ?? "No phone"}</p>
                          </td>
                          <td className="px-4 py-3">{student.batchEnrollments[0]?.batch.name ?? "No batch"}</td>
                          <td className="px-4 py-3">{categoryLabels[student.category.toLowerCase() as keyof typeof categoryLabels] ?? student.category}</td>
                          <td className="px-4 py-3 text-right">{student.attendance.length ? `${studentAttendanceRate}%` : "-"}</td>
                          <td className="py-3 pl-4 text-right">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${latestFee?.pendingAmount ? "bg-amber-500/10 text-amber-200 ring-amber-400/20" : "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20"}`}>
                              {latestFee ? (latestFee.pendingAmount > 0 ? money(latestFee.pendingAmount) : "Clear") : "No record"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <UsefulEmpty title="No students enrolled" detail="Add or assign students before this overview can show operational signals." href={`/admin/standards/${standardId}/students`} action="Open students" />
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Faculty Load" detail={`${teachers.length} teachers connected to this standard`} href={`/admin/standards/${standardId}/teachers`} action="Manage faculty">
            {teachers.length > 0 ? (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-3 rounded-lg bg-slate-950/45 p-3 ring-1 ring-white/10">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-semibold text-slate-200">
                      {initials(teacher.firstName, teacher.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{teacher.firstName} {teacher.lastName}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{teacher.specialization || teacher.qualification || "Faculty"} · {teacher.batches.length} batches</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{teacher.teacherCode}</span>
                  </div>
                ))}
              </div>
            ) : (
              <UsefulEmpty title="No faculty assigned" detail="Assign teachers so batch ownership is visible." href={`/admin/standards/${standardId}/teachers/add`} action="Assign teacher" />
            )}
          </Panel>

          <Panel title="Upcoming Exams" detail={`${upcomingExams.length} scheduled assessments`} href={`/admin/standards/${standardId}/exams`} action="Open exams">
            {upcomingExams.length > 0 ? (
              <div className="space-y-3">
                {upcomingExams.map((exam) => (
                  <div key={exam.id} className="rounded-lg bg-slate-950/45 p-3 ring-1 ring-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{exam.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{exam.subject?.name ?? "No subject"}{exam.batch ? ` · ${exam.batch.name}` : ""}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
                        {dateLabel(exam.examDate)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{exam.totalMarks} marks</p>
                  </div>
                ))}
              </div>
            ) : (
              <UsefulEmpty title="No exams scheduled" detail="Schedule the next assessment to keep academic tracking current." href={`/admin/standards/${standardId}/exams/create`} action="Create exam" />
            )}
          </Panel>

          <Panel title="Recent Collections" detail={`${latestPayments.length} latest payments`} href={`/admin/standards/${standardId}/fees`} action="Review fees">
            {latestPayments.length > 0 ? (
              <div className="space-y-3">
                {latestPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/45 p-3 ring-1 ring-white/10">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{payment.feeRecord.student.firstName} {payment.feeRecord.student.lastName}</p>
                      <p className="mt-1 text-xs text-slate-500">{payment.paymentMode} · {dateLabel(payment.paidAt)}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-emerald-300">{money(payment.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <UsefulEmpty title="No recent collections" detail="Collections will appear here once fee payments are recorded." href="/admin/fees/collect" action="Collect fee" />
            )}
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, detail, icon, tone = "neutral" }: { label: string; value: number | string; detail: string; icon: ReactNode; tone?: "neutral" | "good" | "warn" }) {
  const toneClass = {
    neutral: "text-white",
    good: "text-emerald-300",
    warn: "text-amber-200",
  }[tone];

  return (
    <div className="flex h-full min-w-0 flex-col justify-between rounded-xl bg-slate-900 p-3 shadow-sm ring-1 ring-white/10">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        <span className="mt-0.5 shrink-0 text-slate-500">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className={`truncate text-2xl font-semibold leading-none ${toneClass}`}>{value}</p>
        <p className="mt-3 line-clamp-2 text-xs leading-4 text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function Panel({ title, detail, href, action, children }: { title: string; detail: string; href: string; action: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-slate-900 p-4 shadow-sm ring-1 ring-white/10">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <Link href={href} className="shrink-0 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200">
          {action} <ArrowUpRight className="inline h-3 w-3" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function UsefulEmpty({ title, detail, href, action }: { title: string; detail: string; href: string; action: string }) {
  return (
    <div className="rounded-lg bg-slate-950/45 p-4 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      <Link href={href} className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200">
        {action}
      </Link>
    </div>
  );
}

function StatusCell({ label, value, tone = "slate" }: { label: string; value: number | string; tone?: "slate" | "amber" | "emerald" }) {
  const toneClass = {
    slate: "text-white",
    amber: "text-amber-200",
    emerald: "text-emerald-300",
  }[tone];

  return (
    <div className="rounded-lg bg-slate-950/60 px-3 py-2 ring-1 ring-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
