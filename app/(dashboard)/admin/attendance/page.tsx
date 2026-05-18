import AttendanceOverviewPage from '@/components/admin/attendance/Overview/AttendanceOverviewPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Attendance - TuitionPro',
  description: 'Track and manage student attendance',
};

export default function Page() {
  return <AttendanceOverviewPage />;
}
