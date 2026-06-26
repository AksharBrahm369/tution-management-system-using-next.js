'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, Save, Users, Clock3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE'];

function formatDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function MarkAttendancePage({
  standardId,
  standardName,
  basePath = "/admin/attendance",
}: {
  standardId?: string;
  standardName?: string;
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const batchFromUrl = searchParams.get('batch') ?? searchParams.get('batchId') ?? '';
  const [selectedBatchId, setSelectedBatchId] = useState(batchFromUrl);
  const [selectedDate, setSelectedDate] = useState(formatDateInputValue(new Date()));
  const [notifyParents, setNotifyParents] = useState(true);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; lateMinutes?: string; arrivalTime?: string; leaveReason?: string }>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (batchFromUrl) {
      setSelectedBatchId(batchFromUrl);
    }
  }, [batchFromUrl]);

  const batchesQuery = useQuery({
    queryKey: ['attendance', 'batches', standardId ?? 'all'],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (standardId) params.set('standardId', standardId);
      const res = await fetch(`/api/admin/batches?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load batches');
      return res.json();
    },
  });

  const studentsQuery = useQuery({
    queryKey: ['attendance', 'batch-students', selectedBatchId],
    enabled: Boolean(selectedBatchId),
    queryFn: async () => {
      const res = await fetch(`/api/admin/batches/${selectedBatchId}/students`);
      if (!res.ok) throw new Error('Failed to load students');
      return res.json();
    },
  });

  const existingAttendanceQuery = useQuery({
    queryKey: ['attendance', 'existing', selectedBatchId, selectedDate],
    enabled: Boolean(selectedBatchId && selectedDate),
    queryFn: async () => {
      const res = await fetch(`/api/admin/attendance?batchId=${selectedBatchId}&fromDate=${selectedDate}T00:00:00.000Z&toDate=${selectedDate}T23:59:59.999Z&limit=100`);
      if (!res.ok) throw new Error('Failed to load existing attendance');
      return res.json();
    },
  });

  const batchOptions = batchesQuery.data?.batches ?? [];
  const enrollments = studentsQuery.data?.enrollments ?? [];
  const existingRecords = existingAttendanceQuery.data?.data?.records ?? [];

  useEffect(() => {
    if (!enrollments.length) return;

    const recordMap: Record<string, { status: string; lateMinutes?: string; arrivalTime?: string; leaveReason?: string }> = {};

    for (const enrollment of enrollments) {
      const existing = existingRecords.find((record: { studentId: string }) => record.studentId === enrollment.student.id);
      if (existing) {
        recordMap[enrollment.student.id] = {
          status: existing.status,
          lateMinutes: existing.lateMinutes ? String(existing.lateMinutes) : '',
          arrivalTime: existing.arrivalTime ?? '',
          leaveReason: existing.leaveReason ?? '',
        };
      }
    }

    if (Object.keys(recordMap).length > 0) {
      setAttendanceMap(recordMap);
    }
  }, [enrollments, existingRecords]);

  const summary = useMemo(() => {
    const values = Object.values(attendanceMap);
    const present = values.filter((record) => record.status === 'PRESENT').length;
    const absent = values.filter((record) => record.status === 'ABSENT').length;
    const late = values.filter((record) => record.status === 'LATE').length;
    const onLeave = values.filter((record) => record.status === 'ON_LEAVE').length;
    const unmarked = enrollments.length - values.length;

    return { present, absent, late, onLeave, unmarked, total: enrollments.length };
  }, [attendanceMap, enrollments.length]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceMap((current) => ({
      ...current,
      [studentId]: {
        status,
        lateMinutes: status === 'LATE' ? current[studentId]?.lateMinutes ?? '' : '',
        arrivalTime: status === 'LATE' ? current[studentId]?.arrivalTime ?? '' : '',
        leaveReason: status === 'ON_LEAVE' ? current[studentId]?.leaveReason ?? '' : '',
      },
    }));
  };

  const handleFieldChange = (studentId: string, field: 'lateMinutes' | 'arrivalTime' | 'leaveReason', value: string) => {
    setAttendanceMap((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] ?? { status: 'PRESENT' }),
        [field]: value,
      },
    }));
  };

  const markAll = (status: string) => {
    const next: Record<string, { status: string; lateMinutes?: string; arrivalTime?: string; leaveReason?: string }> = {};
    for (const enrollment of enrollments) {
      next[enrollment.student.id] = { status };
    }
    setAttendanceMap(next);
  };

  const clearAll = () => setAttendanceMap({});

  const submitAttendance = async () => {
    if (!selectedBatchId) {
      setError('Please select a batch first.');
      return;
    }

    if (enrollments.length === 0) {
      setError('No students are enrolled in this batch.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const attendance = enrollments
        .map((enrollment: { student: { id: string } }) => {
          const record = attendanceMap[enrollment.student.id];
          if (!record) return null;

          const item: {
            studentId: string;
            status: string;
            lateMinutes?: number;
            arrivalTime?: string;
            leaveReason?: string;
          } = {
            studentId: enrollment.student.id,
            status: record.status,
          };

          if (record.status === 'LATE' && record.lateMinutes) {
            item.lateMinutes = Number(record.lateMinutes);
            if (record.arrivalTime) {
              item.arrivalTime = record.arrivalTime;
            }
          }

          if (record.status === 'ON_LEAVE' && record.leaveReason) {
            item.leaveReason = record.leaveReason;
          }

          return item;
        })
        .filter(Boolean);

      const res = await fetch('/api/admin/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          date: new Date(selectedDate).toISOString(),
          attendance,
          notifyParents,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to mark attendance');
      }

      toast.success(`Attendance saved successfully. ${data?.data?.attendanceRecordsCount ?? attendance.length} records updated.`);
      setAttendanceMap({});
      await queryClient.invalidateQueries({ queryKey: ['attendance'] });
      router.refresh();
      router.push(basePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link href={basePath} className="hover:underline">{standardName ? `${standardName} Attendance` : 'Attendance'}</Link>
            <span>/</span>
            <span>Mark</span>
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Mark Attendance</h2>
          <p className="text-slate-600 dark:text-slate-300">{standardName ? `Mark attendance only for ${standardName} batches.` : 'Select a batch, mark each student, then submit once.'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={basePath}>Back to Overview</Link>
          </Button>
          <Button variant="outline" onClick={() => markAll('PRESENT')} disabled={!enrollments.length}>
            Mark All Present
          </Button>
        </div>
      </div>

      {message ? (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <CardContent className="flex items-center gap-3 pt-6 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            <span>{message}</span>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
          <CardContent className="flex items-center gap-3 pt-6 text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Present</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{summary.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Absent</p>
            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{summary.absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Late / Leave</p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.late + summary.onLeave}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">Unmarked</p>
            <p className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">{summary.unmarked}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" /> Batch and Date
          </CardTitle>
          <CardDescription>Select the class session you want to mark.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium">Batch</span>
            <select
              value={selectedBatchId}
              onChange={(event) => setSelectedBatchId(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              <option value="">Select batch</option>
              {batchOptions.map((batch: { id: string; name: string; code: string; subject?: { name: string } }) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} {batch.subject?.name ? `- ${batch.subject.name}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Date</span>
            <input
              type="date"
              value={selectedDate}
              max={formatDateInputValue(new Date())}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <input
              type="checkbox"
              checked={notifyParents}
              onChange={(event) => setNotifyParents(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Notify parents for absentees</span>
          </label>
        </CardContent>
      </Card>


      {selectedBatchId ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Students
              </CardTitle>
              <CardDescription>
                {studentsQuery.isLoading
                  ? 'Loading students...'
                  : `${enrollments.length} enrolled students loaded`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentsQuery.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No students enrolled in this batch.
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments.map((enrollment: { student: { id: string; firstName: string; lastName: string; studentCode: string; phone?: string } }) => {
                    const record = attendanceMap[enrollment.student.id] ?? { status: 'PRESENT' };

                    return (
                      <div key={enrollment.student.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-950 dark:text-slate-50">
                                {enrollment.student.firstName} {enrollment.student.lastName}
                              </h3>
                              <Badge variant="secondary">{enrollment.student.studentCode}</Badge>
                            </div>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{enrollment.student.phone || 'No phone number available'}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {DEFAULT_STATUSES.map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(enrollment.student.id, status)}
                                className={`rounded-full border px-3 py-2 text-sm font-medium transition ${record.status === status
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                                  }`}
                              >
                                {status === 'PRESENT' && 'Present'}
                                {status === 'ABSENT' && 'Absent'}
                                {status === 'LATE' && 'Late'}
                                {status === 'ON_LEAVE' && 'Leave'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {record.status === 'LATE' ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <label className="space-y-2">
                              <span className="text-sm font-medium">Late minutes</span>
                              <input
                                type="number"
                                min="1"
                                value={record.lateMinutes ?? ''}
                                onChange={(event) => handleFieldChange(enrollment.student.id, 'lateMinutes', event.target.value)}
                                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium">Arrival time</span>
                              <input
                                type="time"
                                value={record.arrivalTime ?? ''}
                                onChange={(event) => handleFieldChange(enrollment.student.id, 'arrivalTime', event.target.value)}
                                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                              />
                            </label>
                          </div>
                        ) : null}

                        {record.status === 'ON_LEAVE' ? (
                          <div className="mt-4">
                            <label className="space-y-2">
                              <span className="text-sm font-medium">Leave reason</span>
                              <input
                                type="text"
                                value={record.leaveReason ?? ''}
                                onChange={(event) => handleFieldChange(enrollment.student.id, 'leaveReason', event.target.value)}
                                placeholder="Reason for leave"
                                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                              />
                            </label>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" /> {selectedDate}</span>
                <span>{summary.total} students</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={clearAll} disabled={isSubmitting || enrollments.length === 0}>
                  Clear All
                </Button>
                <Button variant="outline" onClick={() => markAll('ABSENT')} disabled={isSubmitting || enrollments.length === 0}>
                  Mark All Absent
                </Button>
                <Button onClick={submitAttendance} disabled={isSubmitting || enrollments.length === 0}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Submit Attendance
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-slate-500 dark:text-slate-400">
            Select a batch to load enrolled students and begin marking attendance.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
