import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Fetch recent students with their batch enrollment and fee status
    const recentStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        joiningDate: true,
        createdAt: true,
        batchEnrollments: {
          where: { isActive: true },
          take: 1,
          select: {
            batch: {
              select: { name: true },
            },
          },
        },
        feeRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    const formatted = recentStudents.map((s) => {
      const batchName =
        s.batchEnrollments[0]?.batch?.name ?? 'Not Enrolled';

      // Map FeeStatus enum to UI display
      const feeStatusRaw = s.feeRecords[0]?.status ?? 'PENDING';
      let feeStatus: 'Paid' | 'Pending' | 'Overdue' = 'Pending';
      if (feeStatusRaw === 'PAID') feeStatus = 'Paid';
      else if (feeStatusRaw === 'OVERDUE') feeStatus = 'Overdue';
      else feeStatus = 'Pending';

      return {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`.trim(),
        email: s.email ?? '',
        batch: batchName,
        joinDate: s.joiningDate ?? s.createdAt,
        feeStatus,
      };
    });

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Recent students error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.startsWith('Forbidden')
      ? 403
      : message.startsWith('Unauthorized')
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
