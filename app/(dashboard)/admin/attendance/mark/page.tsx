import { Suspense } from 'react';
import MarkAttendancePage from '@/components/admin/attendance/Mark/MarkAttendancePage';

export const metadata = {
  title: 'Mark Attendance | TuitionPro',
  description: 'Mark attendance for a batch',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-slate-500">Loading...</div>}>
      <MarkAttendancePage />
    </Suspense>
  );
}
