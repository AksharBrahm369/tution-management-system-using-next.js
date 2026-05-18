'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface BatchSummary {
  batchId: string;
  batchName: string;
  batchCode: string;
  subject: string;
  teacher: string;
  time: string;
  totalStudents: number;
  markedCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  isMarked: boolean;
  markedBy?: string;
  markedAt?: string;
}

interface TodayBatchStatusProps {
  batchSummaries: BatchSummary[];
}

export default function TodayBatchStatus({ batchSummaries }: TodayBatchStatusProps) {
  if (batchSummaries.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center text-muted-foreground">
          No classes scheduled for today
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Today's Batch Status</h2>
      <div className="grid grid-cols-1 gap-4">
        {batchSummaries.map((batch) => {
          const percentage =
            batch.totalStudents > 0
              ? Math.round(
                  ((batch.presentCount + batch.lateCount) /
                    batch.totalStudents) *
                    100
                )
              : 0;

          return (
            <Card key={batch.batchId} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{batch.batchName}</h3>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-sm text-muted-foreground">
                          📍 {batch.time}
                        </span>
                        {batch.subject && (
                          <span className="text-sm text-muted-foreground">
                            📚 {batch.subject}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Teacher: {batch.teacher}
                      </p>
                    </div>
                    <Badge
                      variant={batch.isMarked ? "default" : "secondary"}
                      className="whitespace-nowrap"
                    >
                      {batch.isMarked ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Marked ✓
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {batch.markedCount} / {batch.totalStudents} marked
                      </span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all"
                        style={{
                          width: `${(batch.markedCount / batch.totalStudents) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
                      <p className="font-semibold text-green-600">{batch.presentCount}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
                      <p className="font-semibold text-red-600">{batch.absentCount}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
                      <p className="font-semibold text-orange-600">{batch.lateCount}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <p className="font-semibold text-blue-600">{batch.leaveCount}</p>
                      <p className="text-xs text-muted-foreground">Leave</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/admin/attendance/mark?batch=${batch.batchId}`}>
                        {batch.isMarked ? 'Edit' : 'Mark Now'}
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1">
                      <Link href={`/admin/attendance/reports?batch=${batch.batchId}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
