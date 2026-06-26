import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';
import { subMonths, format } from 'date-fns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
};

const EMPTY_CHARTS = {
  monthlyFeeCollection: Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return { month: format(date, 'MMM'), collected: 0, pending: 0 };
  }),
  attendanceOverview: { present: 0, absent: 0, late: 0 },
};

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    try {
      const chartMonths = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), 5 - i);
        return { date, month: date.getMonth() + 1, year: date.getFullYear() };
      });

      const [feeBuckets, attendanceBuckets] = await Promise.all([
        prisma.feeRecord.groupBy({
          by: ['month', 'year'],
          where: {
            OR: chartMonths.map((item) => ({ month: item.month, year: item.year })),
          },
          _sum: {
            paidAmount: true,
            pendingAmount: true,
          },
        }),
        prisma.attendance.groupBy({
          by: ['status'],
          where: {
            date: { gte: subMonths(new Date(), 1) },
          },
          _count: { _all: true },
        }),
      ]);

      const feeByMonth = new Map(
        feeBuckets.map((item) => [`${item.year}-${item.month}`, item])
      );

      const monthlyFeeData = chartMonths.map(({ date, month, year }) => {
        const bucket = feeByMonth.get(`${year}-${month}`);
        return {
          month: format(date, 'MMM'),
          collected: Math.round(bucket?._sum.paidAmount ?? 0),
          pending: Math.round(bucket?._sum.pendingAmount ?? 0),
        };
      });

      const attendanceByStatus = new Map(
        attendanceBuckets.map((item) => [item.status, item._count._all])
      );

      const attendanceData = {
        present:
          (attendanceByStatus.get('PRESENT') ?? 0) +
          (attendanceByStatus.get('LATE') ?? 0) +
          (attendanceByStatus.get('HALF_DAY') ?? 0),
        absent: attendanceByStatus.get('ABSENT') ?? 0,
        late: attendanceByStatus.get('LATE') ?? 0,
      };

      return NextResponse.json(
        {
          monthlyFeeCollection: monthlyFeeData,
          attendanceOverview: attendanceData,
        },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    } catch (dashboardError) {
      console.error('Dashboard charts query error:', dashboardError);
      return NextResponse.json(EMPTY_CHARTS, { status: 200, headers: NO_STORE_HEADERS });
    }
  } catch (error) {
    console.error('Dashboard charts error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.startsWith('Forbidden')
      ? 403
      : message.startsWith('Unauthorized')
        ? 401
        : 500;
    return NextResponse.json(
      { error: message },
      { status, headers: NO_STORE_HEADERS }
    );
  }
}
