# Attendance Module - Complete Component & Page Templates

## Quick Generation Instructions

All remaining files can be created using the templates below. Copy the exact code and save to the corresponding file path.

---

## COMPONENTS - Ready to Use

### Mark Attendance Page

File: `components/admin/attendance/Mark/MarkAttendancePage.tsx`
```typescript
'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BatchDateSelector from './BatchDateSelector';
import AttendanceMarkingList from './AttendanceMarkingList';
import QuickActionBar from './QuickActionBar';
import SubmitConfirmModal from './SubmitConfirmModal';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MarkAttendancePage() {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Array<{ studentId: string; status: string }>>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: batchData } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const res = await fetch('/api/admin/attendance/batches');
      return res.json();
    },
  });

  const { data: enrollmentData, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments', selectedBatch],
    queryFn: async () => {
      if (!selectedBatch) return null;
      const res = await fetch(`/api/admin/attendance/batch/${selectedBatch}`);
      return res.json();
    },
    enabled: !!selectedBatch,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatch,
          date: selectedDate,
          attendance,
          notifyParents: true,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setSuccessMessage('Attendance marked successfully!');
        setAttendance([]);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    },
  });

  const handleMarkAll = (status: string) => {
    const enrollments = enrollmentData?.data?.enrollments || [];
    const newAttendance = enrollments.map((e: any) => ({
      studentId: e.studentId,
      status,
    }));
    setAttendance(newAttendance);
  };

  const handleReset = () => {
    setAttendance([]);
  };

  const handleUpdateStudent = (studentId: string, status: string) => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId);
      if (existing) {
        if (existing.status === status) {
          return prev.filter(a => a.studentId !== studentId);
        }
        return prev.map(a => a.studentId === studentId ? { ...a, status } : a);
      }
      return [...prev, { studentId, status }];
    });
  };

  if (successMessage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <h2 className="text-lg font-semibold">{successMessage}</h2>
              <Button onClick={() => setSuccessMessage('')} className="w-full">
                Mark Another Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Mark Attendance</h1>
        <p className="text-muted-foreground">Record attendance for today's classes</p>
      </div>

      {/* Selection */}
      <BatchDateSelector
        selectedBatch={selectedBatch}
        selectedDate={selectedDate}
        onBatchChange={setSelectedBatch}
        onDateChange={setSelectedDate}
        batches={batchData?.data || []}
      />

      {selectedBatch && (
        <>
          {/* Quick Actions */}
          <QuickActionBar
            markedCount={attendance.length}
            totalCount={enrollmentData?.data?.enrollments?.length || 0}
            onMarkAll={() => handleMarkAll('PRESENT')}
            onMarkAllAbsent={() => handleMarkAll('ABSENT')}
            onReset={handleReset}
          />

          {/* Attendance List */}
          {loadingEnrollments ? (
            <Card><CardContent className="pt-6">Loading...</CardContent></Card>
          ) : (
            <AttendanceMarkingList
              enrollments={enrollmentData?.data?.enrollments || []}
              attendance={attendance}
              onUpdateStudent={handleUpdateStudent}
            />
          )}

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-background border-t border-border p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              Clear All
            </Button>
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={attendance.length === 0}
              isLoading={markAttendanceMutation.isPending}
            >
              Submit Attendance
            </Button>
          </div>

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <SubmitConfirmModal
              attendance={attendance}
              enrollments={enrollmentData?.data?.enrollments || []}
              onConfirm={() => {
                markAttendanceMutation.mutate();
                setShowConfirmModal(false);
              }}
              onCancel={() => setShowConfirmModal(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
```

### Shared Status Badge Component

File: `components/shared/attendance/AttendanceStatusBadge.tsx`
```typescript
'use client';

import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'CANCELLED';
  size?: 'sm' | 'md' | 'lg';
}

export function AttendanceStatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    ABSENT: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    LATE: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
    HALF_DAY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    ON_LEAVE: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    HOLIDAY: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200',
    CANCELLED: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
  };

  const labels: Record<string, string> = {
    PRESENT: '✓ Present',
    ABSENT: '✕ Absent',
    LATE: '⏱ Late',
    HALF_DAY: '◐ Half Day',
    ON_LEAVE: '🏖 Leave',
    HOLIDAY: '🏖 Holiday',
    CANCELLED: '✕ Cancelled',
  };

  return (
    <Badge variant="secondary" className={colors[status]}>
      {labels[status]}
    </Badge>
  );
}
```

### Student Attendance View

File: `components/student/attendance/StudentAttendancePage.tsx`
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import AttendanceSummaryCards from './AttendanceSummaryCards';
import BatchAttendanceTabs from './BatchAttendanceTabs';
import { useSession } from 'next-auth/react';

export default function StudentAttendancePage() {
  const { data: session } = useSession();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance'],
    queryFn: async () => {
      const res = await fetch('/api/student/attendance');
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  const data = attendanceData?.data;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground">Track your attendance records</p>
      </div>

      {/* Low Attendance Warning */}
      {data?.overallPercentage < 75 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your overall attendance ({data.overallPercentage}%) is below 75%. Please ensure regular attendance.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <AttendanceSummaryCards
        overallPercentage={data?.overallPercentage}
        totalClasses={data?.totalClasses}
        present={data?.present}
        absent={data?.absent}
        late={data?.late}
      />

      {/* Batch-wise Details */}
      {data?.batches?.length > 0 ? (
        <BatchAttendanceTabs batches={data.batches} />
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No attendance records found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## PAGE FILES - Ready to Use

### Mark Attendance Page

File: `app/(dashboard)/admin/attendance/mark/page.tsx`
```typescript
import MarkAttendancePage from '@/components/admin/attendance/Mark/MarkAttendancePage';

export const metadata = {
  title: 'Mark Attendance - TuitionPro',
  description: 'Mark student attendance for batches',
};

export default function Page() {
  return <MarkAttendancePage />;
}
```

### Reports Page

File: `app/(dashboard)/admin/attendance/reports/page.tsx`
```typescript
import AttendanceReportsPage from '@/components/admin/attendance/Reports/AttendanceReportsPage';

export const metadata = {
  title: 'Attendance Reports - TuitionPro',
  description: 'View attendance reports and analytics',
};

export default function Page() {
  return <AttendanceReportsPage />;
}
```

### Alerts Page

File: `app/(dashboard)/admin/attendance/alerts/page.tsx`
```typescript
import AttendanceAlertsPage from '@/components/admin/attendance/Alerts/AttendanceAlertsPage';

export const metadata = {
  title: 'Attendance Alerts - TuitionPro',
  description: 'Manage attendance alerts and low attendance students',
};

export default function Page() {
  return <AttendanceAlertsPage />;
}
```

### Teacher Attendance Page

File: `app/(dashboard)/teacher/attendance/page.tsx`
```typescript
import TeacherAttendancePage from '@/components/teacher/attendance/TeacherAttendancePage';

export const metadata = {
  title: 'Mark Attendance - TuitionPro',
  description: 'Mark attendance for your batches',
};

export default function Page() {
  return <TeacherAttendancePage />;
}
```

### Student Attendance Page

File: `app/(dashboard)/student/attendance/page.tsx`
```typescript
import StudentAttendancePage from '@/components/student/attendance/StudentAttendancePage';

export const metadata = {
  title: 'My Attendance - TuitionPro',
  description: 'View your attendance records',
};

export default function Page() {
  return <StudentAttendancePage />;
}
```

### Parent Attendance Page

File: `app/(dashboard)/parent/attendance/page.tsx`
```typescript
import ParentAttendancePage from '@/components/parent/attendance/ParentAttendancePage';

export const metadata = {
  title: 'Child Attendance - TuitionPro',
  description: 'View your child\'s attendance records',
};

export default function Page() {
  return <ParentAttendancePage />;
}
```

---

## CREATE THESE REMAINING COMPONENT STUBS

All below should be `'use client';` components. Create empty or basic implementations:

1. `components/admin/attendance/Mark/BatchDateSelector.tsx`
2. `components/admin/attendance/Mark/AttendanceMarkingList.tsx`
3. `components/admin/attendance/Mark/StudentAttendanceRow.tsx`
4. `components/admin/attendance/Mark/QuickActionBar.tsx`
5. `components/admin/attendance/Mark/QRCodeSection.tsx`
6. `components/admin/attendance/Mark/AttendanceSummaryBar.tsx`
7. `components/admin/attendance/Mark/SubmitConfirmModal.tsx`
8. `components/admin/attendance/Reports/AttendanceReportsPage.tsx`
9. `components/admin/attendance/Reports/ReportFilters.tsx`
10. `components/admin/attendance/Reports/StudentWiseReport.tsx`
11. `components/admin/attendance/Reports/BatchWiseReport.tsx`
12. `components/admin/attendance/Reports/DateWiseReport.tsx`
13. `components/admin/attendance/Reports/MonthlyReport.tsx`
14. `components/admin/attendance/Alerts/AttendanceAlertsPage.tsx`
15. `components/admin/attendance/Alerts/AlertThresholdSettings.tsx`
16. `components/admin/attendance/Alerts/AlertCard.tsx`
17. `components/admin/attendance/Alerts/BulkReminderModal.tsx`
18. `components/teacher/attendance/TeacherAttendancePage.tsx`
19. `components/teacher/attendance/MyBatchesToday.tsx`
20. `components/teacher/attendance/AttendanceHistoryTable.tsx`
21. `components/student/attendance/AttendanceSummaryCards.tsx`
22. `components/student/attendance/BatchAttendanceTabs.tsx`
23. `components/student/attendance/AttendanceCalendar.tsx`
24. `components/parent/attendance/ParentAttendancePage.tsx`
25. `components/shared/attendance/AttendanceProgressBar.tsx`
26. `components/shared/attendance/AttendanceCalendarView.tsx`

---

## QUICK SETUP COMMANDS

```bash
# Create all component directories
mkdir -p components/admin/attendance/{Mark,Reports,Alerts}
mkdir -p components/teacher/attendance
mkdir -p components/student/attendance
mkdir -p components/parent/attendance
mkdir -p components/shared/attendance

# Create all page directories
mkdir -p app/\(dashboard\)/admin/attendance/{mark,reports,alerts}
mkdir -p app/\(dashboard\)/teacher/attendance
mkdir -p app/\(dashboard\)/student/attendance
mkdir -p app/\(dashboard\)/parent/attendance
```

