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
        batchId: true,
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

    // Fetch all active batches running today
    const activeBatches = await prisma.batch.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: todayEnd },
        OR: [
          { endDate: null },
          { endDate: { gte: todayStart } },
        ],
      },
      include: {
        teacher: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        room: {
          select: { name: true },
        },
      },
    });

    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayDayName = dayNames[now.getDay()];

    const batchesRunningToday = activeBatches.filter((b) =>
      b.days.includes(todayDayName as any)
    );

    const formattedRealSessions = sessions.map((s) => {
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
        status: mappedStatus as 'upcoming' | 'ongoing' | 'completed',
        startTimeRaw: s.startTime,
        batchId: s.batchId,
      };
    });

    const realSessionBatchIds = new Set(sessions.map((s) => s.batchId));

    const virtualSessions = batchesRunningToday
      .filter((b) => !realSessionBatchIds.has(b.id))
      .map((b) => {
        const currentHHMM = now.toTimeString().slice(0, 5);
        let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
        if (currentHHMM >= b.startTime && currentHHMM <= b.endTime) {
          status = 'ongoing';
        } else if (currentHHMM > b.endTime) {
          status = 'completed';
        }

        return {
          id: `virtual-${b.id}`,
          name: b.name,
          teacher: b.teacher?.user?.name ?? 'TBA',
          time: `${b.startTime} - ${b.endTime}`,
          room: b.room?.name ?? 'Online',
          status,
          startTimeRaw: b.startTime,
          batchId: b.id,
        };
      });

    const allSessions = [...formattedRealSessions, ...virtualSessions];
    allSessions.sort((a, b) => a.startTimeRaw.localeCompare(b.startTimeRaw));

    const result = allSessions.slice(0, 10).map(({ startTimeRaw, batchId, ...rest }) => rest);

    return NextResponse.json(result, { status: 200, headers: NO_STORE_HEADERS });
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
