import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
};

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    // Fetch real recent payments from the database
    const payments = await prisma.feePayment.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { paidAt: 'desc' },
      take: 6,
      select: {
        id: true,
        amount: true,
        paymentMode: true,
        paidAt: true,
        feeRecord: {
          select: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const formatted = payments.map((p) => {
      const student = p.feeRecord?.student;
      let name = 'Unknown Student';
      if (student) {
        if (student.firstName || student.lastName) {
          name = `${student.firstName} ${student.lastName}`.trim();
        } else if (student.user?.name) {
          name = student.user.name;
        }
      }
      const initials = name
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? '')
        .join('');

      return {
        id: p.id,
        studentName: name,
        amount: p.amount,
        date: p.paidAt,
        method: (p.paymentMode as string) ?? 'Online',
        avatar: initials || 'S',
      };
    });

    return NextResponse.json(formatted, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Recent payments error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.startsWith('Forbidden')
      ? 403
      : message.startsWith('Unauthorized')
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
  }
}
