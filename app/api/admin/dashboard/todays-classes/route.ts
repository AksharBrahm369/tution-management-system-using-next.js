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

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch real class sessions from the database for today
    const sessions = await prisma.classSession.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: {
          in: ['SCHEDULED', 'ONGOING', 'COMPLETED'],
        },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        topic: true,
        status: true,
        batch: {
          select: {
            name: true,
            teacher: {
              select: {
                user: {
                  select: { name: true },
                },
              },
            },
          },
        },
        room: {
          select: { name: true },
        },
      },
    });

    const formatted = sessions.map((s) => {
      const rawStatus = s.status.toLowerCase();
      const mappedStatus =
        rawStatus === 'scheduled'
          ? 'upcoming'
          : rawStatus === 'ongoing'
          ? 'ongoing'
          : 'completed';

      return {
        id: s.id,
        name: s.topic ? `${s.batch.name} — ${s.topic}` : s.batch.name,
        teacher: s.batch.teacher?.user?.name ?? 'TBA',
        time: `${s.startTime} - ${s.endTime}`,
        room: s.room?.name ?? 'Online',
        status: mappedStatus,
      };
    });

    return NextResponse.json(formatted, { status: 200, headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Today classes error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.startsWith('Forbidden')
      ? 403
      : message.startsWith('Unauthorized')
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS });
  }
}
