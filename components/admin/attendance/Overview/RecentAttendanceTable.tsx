'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  student: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  batch: {
    name: string;
  };
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'CANCELLED';
  date: string;
  markedBy: string;
  markedAt: string;
  parentNotified: boolean;
}

interface RecentTableProps {
  data?: AttendanceRecord[];
}

export default function RecentAttendanceTable({ data }: RecentTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'LATE':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200';
      case 'ON_LEAVE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'HALF_DAY':
        return 'Half Day';
      case 'ON_LEAVE':
        return 'On Leave';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Attendance Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-semibold">Student</th>
                <th className="text-left py-3 px-2 font-semibold">Batch</th>
                <th className="text-left py-3 px-2 font-semibold">Date</th>
                <th className="text-left py-3 px-2 font-semibold">Status</th>
                <th className="text-left py-3 px-2 font-semibold">Marked By</th>
                <th className="text-center py-3 px-2 font-semibold">Notified</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((record) => (
                <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={record.student.profilePhoto} />
                        <AvatarFallback>
                          {record.student.firstName[0]}{record.student.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {record.student.firstName} {record.student.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{record.batch.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={getStatusColor(record.status)}>
                      {getStatusLabel(record.status)}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground text-xs">{record.markedBy}</td>
                  <td className="py-3 px-2 text-center">
                    {record.parentNotified ? (
                      <span className="text-green-600 text-xs font-semibold">✓</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data || data.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
