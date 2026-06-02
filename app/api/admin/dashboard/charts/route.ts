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
      const feeRecords = await prisma.feeRecord.findMany({
        where: {
          createdAt: {
            gte: subMonths(new Date(), 6),
          },
        },
        select: {
          month: true,
          year: true,
          paidAmount: true,
          pendingAmount: true,
        },
      });

      const monthlyFeeData = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), 5 - i);
        const m = date.getMonth() + 1;
        const y = date.getFullYear();

        const matchingRecords = feeRecords.filter((r) => r.month === m && r.year === y);
        const collected = matchingRecords.reduce((sum, r) => sum + Number(r.paidAmount ?? 0), 0);
        const pending = matchingRecords.reduce((sum, r) => sum + Number(r.pendingAmount ?? 0), 0);

        return {
          month: format(date, 'MMM'),
          collected: Math.round(collected),
          pending: Math.round(pending),
        };
      });

      const presentCount = await prisma.attendance.count({
        where: {
          status: {
            in: ['PRESENT', 'LATE'],
          },
        },
      });

      const absentCount = await prisma.attendance.count({
        where: {
          status: 'ABSENT',
        },
      });

      const lateCount = await prisma.attendance.count({
        where: {
          status: 'ON_LEAVE',
        },
      });

      const attendanceData = {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
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
