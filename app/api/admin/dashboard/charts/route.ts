import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';
import { subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // 1. Fetch fee records for the last 6 months to compute monthly collection
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

    // Generate real chart data for last 6 months based on database records
    const monthlyFeeData = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const m = date.getMonth() + 1;
      const y = date.getFullYear();

      // Find all records that fall into this month/year
      const matchingRecords = feeRecords.filter((r) => r.month === m && r.year === y);
      const collected = matchingRecords.reduce((sum, r) => sum + r.paidAmount, 0);
      const pending = matchingRecords.reduce((sum, r) => sum + r.pendingAmount, 0);

      return {
        month: format(date, 'MMM'),
        collected: Math.round(collected),
        pending: Math.round(pending),
      };
    });

    // 2. Fetch attendance overview data from database
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
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard charts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
