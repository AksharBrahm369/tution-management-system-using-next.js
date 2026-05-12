import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';
import { subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Generate mock chart data for last 6 months
    const monthlyFeeData = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMM'),
        collected: Math.floor(Math.random() * 50000) + 20000,
        pending: Math.floor(Math.random() * 30000) + 5000,
      };
    });

    const attendanceData = {
      present: 245,
      absent: 32,
      late: 18,
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
