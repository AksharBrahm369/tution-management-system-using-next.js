import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, BookOpen, GraduationCap, CheckCircle, IndianRupee, CalendarDays, Sparkles, BookOpenCheck, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getStandardById } from "@/lib/standards";
import StandardOverviewCharts from "@/components/admin/standards/StandardOverviewCharts";

export const dynamic = "force-dynamic";

export default async function StandardOverviewPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  // 1. Fetch Students count, category distribution, and enrolled students list
  const [totalStudents, activeStudents, studentStatsGroup, enrolledStudents] = await Promise.all([
    prisma.student.count({ where: { standardId } }),
    prisma.student.count({ where: { standardId, status: "ACTIVE" } }),
    prisma.student.groupBy({
      by: ["category"],
      where: { standardId },
      _count: { _all: true }
    }),
    prisma.student.findMany({
      where: { standardId },
      select: {
        id: true,
        studentCode: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
      },
      orderBy: { firstName: "asc" },
      take: 10,
    })
  ]);

  const categories = {
    topper: 0,
    good: 0,
    average: 0,
    weak: 0,
  };
  studentStatsGroup.forEach(group => {
    const cat = group.category?.toLowerCase();
    if (cat === "topper") categories.topper = group._count._all;
    else if (cat === "good") categories.good = group._count._all;
    else if (cat === "average") categories.average = group._count._all;
    else if (cat === "weak") categories.weak = group._count._all;
  });

  // 2. Fetch Batches details
  const batches = await prisma.batch.findMany({
    where: { standardId },
    include: {
      teacher: { select: { firstName: true, lastName: true } },
      subject: { select: { name: true } },
      enrollments: { where: { isActive: true } },
    },
    orderBy: { name: "asc" }
  });

  // 3. Fetch Teachers list (scoped to standard)
  const teachers = await prisma.teacher.findMany({
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
      email: true,
      phone: true,
      qualification: true,
      specialization: true,
    },
    take: 5
  });

  // 4. Fetch Attendance statistics
  const [totalAttendance, presentCount, absentCount, lateCount, leaveCount] = await Promise.all([
    prisma.attendance.count({ where: { student: { standardId } } }),
    prisma.attendance.count({ where: { student: { standardId }, status: "PRESENT" } }),
    prisma.attendance.count({ where: { student: { standardId }, status: "ABSENT" } }),
    prisma.attendance.count({ where: { student: { standardId }, status: "LATE" } }),
    prisma.attendance.count({ where: { student: { standardId }, status: "ON_LEAVE" } }),
  ]);

  const attendancePercent = totalAttendance > 0
    ? Math.round(((presentCount + lateCount) / totalAttendance) * 100)
    : 0;

  // 5. Fetch Fee records summary
  const feeRecordsAgg = await prisma.feeRecord.aggregate({
    where: { OR: [{ student: { standardId } }, { batch: { standardId } }] },
    _sum: {
      totalAmount: true,
      paidAmount: true,
      pendingAmount: true,
    }
  });

  const totalFees = feeRecordsAgg._sum.totalAmount ?? 0;
  const paidFees = feeRecordsAgg._sum.paidAmount ?? 0;
  const pendingFees = feeRecordsAgg._sum.pendingAmount ?? 0;

  // 6. Fetch Upcoming exams
  const upcomingExams = await prisma.exam.findMany({
    where: {
      OR: [{ standardId }, { batch: { standardId } }],
      examDate: { gte: new Date() },
    },
    include: {
      batch: { select: { name: true } },
      subject: { select: { name: true } }
    },
    orderBy: { examDate: "asc" },
    take: 5
  });

  return (
    <div className="space-y-6 w-full">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/standards/${standardId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800/80"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {standard.name}
        </Link>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-150 dark:bg-cyan-950/60 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
          <Sparkles className="h-3 w-3" /> Live Data Scoped
        </div>
      </div>

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-200/50 bg-linear-to-r from-cyan-600 via-sky-600 to-indigo-700 p-6 text-white shadow-xl shadow-cyan-500/20 md:p-8 dark:border-cyan-500/30">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
        <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-sky-400/20 blur-xl" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Standard Overview</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{standard.name} Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-cyan-100/90 font-medium">
            Real-time analytics and scoping overview for students, batches, attendance, and fee performance in {standard.name}.
          </p>
        </div>
      </section>

      {/* Metrics Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Students</span>
            <Users className="h-5 w-5 text-cyan-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{totalStudents}</p>
          <p className="mt-1 text-xs text-slate-500">{activeStudents} Active enrollments</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Batches</span>
            <BookOpen className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{batches.length}</p>
          <p className="mt-1 text-xs text-slate-500">Active subjects & slots</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Attendance</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{attendancePercent}%</p>
          <p className="mt-1 text-xs text-slate-500">{totalAttendance} total records</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Fees</span>
            <IndianRupee className="h-5 w-5 text-rose-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">₹{pendingFees.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-slate-500">₹{paidFees.toLocaleString("en-IN")} collected</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Teachers</span>
            <GraduationCap className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{teachers.length}</p>
          <p className="mt-1 text-xs text-slate-500">Assigned standard faculty</p>
        </div>
      </section>

      {/* Render Recharts Visuals */}
      <section className="w-full">
        <StandardOverviewCharts
          attendance={{
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            leave: leaveCount,
          }}
          studentCategories={categories}
          fees={{
            collected: paidFees,
            pending: pendingFees,
            total: totalFees,
          }}
        />
      </section>

      {/* Lists Sections: Batches, Teachers, Exams */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Batches and Students Column */}
        <div className="space-y-6">
          {/* Active Batches List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Active Batches</h2>
                <p className="text-xs text-slate-500 mt-0.5">List of batches configured for {standard.name}</p>
              </div>
              <Link
                href={`/admin/standards/${standardId}/batches`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
              >
                Manage <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{batch.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Subject: <strong className="text-slate-700 dark:text-slate-300">{batch.subject?.name || "N/A"}</strong></span>
                      <span>•</span>
                      <span>Teacher: <strong className="text-slate-700 dark:text-slate-300">{batch.teacher ? `${batch.teacher.firstName} ${batch.teacher.lastName}` : "Unassigned"}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="rounded-full bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                      {batch.enrollments.length} Students
                    </div>
                    <div className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-850 px-2 py-1 rounded-md">
                      {batch.startTime} - {batch.endTime}
                    </div>
                  </div>
                </div>
              ))}
              {batches.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">No batches linked to this standard.</p>
              )}
            </div>
          </div>

          {/* Enrolled Students List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Enrolled Students</h2>
                <p className="text-xs text-slate-500 mt-0.5">Students enrolled in {standard.name}</p>
              </div>
              <Link
                href={`/admin/standards/${standardId}/students`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
              >
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-500 text-xs font-semibold uppercase">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Student Code</th>
                    <th className="py-3 px-2">Contact</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {enrolledStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="py-3 px-2 text-slate-500 font-mono text-xs">
                        {student.studentCode}
                      </td>
                      <td className="py-3 px-2 text-slate-500 text-xs">
                        <div>{student.email || "N/A"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{student.phone || ""}</div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                          student.status === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-slate-50 text-slate-700 dark:bg-slate-850 dark:text-slate-400"
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {enrolledStudents.length === 0 && (
                <p className="text-sm text-slate-500 py-6 text-center">No students enrolled in this standard.</p>
              )}
            </div>
          </div>
        </div>

        {/* Teachers and Upcoming Exams side column */}
        <div className="space-y-6">
          {/* Faculty list */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Assigned Faculty</h2>
                <p className="text-xs text-slate-500 mt-0.5">Teachers teaching this standard</p>
              </div>
              <Link
                href={`/admin/standards/${standardId}/teachers`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                    {teacher.firstName[0]}{teacher.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {teacher.firstName} {teacher.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {teacher.specialization || teacher.qualification || "Faculty Advisor"}
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {teacher.teacherCode}
                  </div>
                </div>
              ))}
              {teachers.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">No teachers assigned to this standard.</p>
              )}
            </div>
          </div>

          {/* Upcoming exams */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Upcoming Exams</h2>
                <p className="text-xs text-slate-500 mt-0.5">Standard exams scheduled</p>
              </div>
              <Link
                href={`/admin/standards/${standardId}/exams`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
              >
                Schedule <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-850 dark:bg-slate-950/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{exam.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Subject: <strong className="text-slate-700 dark:text-slate-350">{exam.subject?.name || "N/A"}</strong>
                      </p>
                      {exam.batch && (
                        <p className="text-xs text-slate-500">
                          Batch: <strong className="text-slate-700 dark:text-slate-350">{exam.batch.name}</strong>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                        {new Date(exam.examDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {exam.totalMarks} Marks
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingExams.length === 0 && (
                <p className="text-sm text-slate-500 py-4 text-center">No upcoming exams scheduled.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
