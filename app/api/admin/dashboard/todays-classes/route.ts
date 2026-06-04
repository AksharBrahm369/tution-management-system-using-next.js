import { DayOfWeek } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
};

function getTeacherDisplayName(
  teacher:
    | {
        firstName?: string | null;
        lastName?: string | null;
        user?: { name?: string | null } | null;
      }
    | null
    | undefined
) {
  if (!teacher) {
    return '';
  }

  const fullName = [teacher.firstName, teacher.lastName]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ')
    .trim();

  if (fullName) {
    return fullName;
  }

  return teacher.user?.name?.trim() ?? '';
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const now = new Date();
    const settings = await prisma.instituteSettings.findFirst({
      select: { timezone: true },
    });
    const tz = settings?.timezone || 'Asia/Kolkata';

    const yearFormatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric' });
    const monthFormatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'numeric' });
    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, day: 'numeric' });
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const localYear = parseInt(yearFormatter.format(now), 10);
    const localMonth = parseInt(monthFormatter.format(now), 10) - 1;
    const localDay = parseInt(dayFormatter.format(now), 10);

    const todayStart = new Date(Date.UTC(localYear, localMonth, localDay, 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(localYear, localMonth, localDay, 23, 59, 59, 999));

    const todayDayName = weekdayFormatter.format(now).toUpperCase() as DayOfWeek;
    const currentHHMM = timeFormatter.format(now);

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
            isOnline: true,
            meetingLink: true,
            room: {
              select: { name: true },
            },
            teacher: {
              select: {
                firstName: true,
                lastName: true,
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

    const activeBatches = await prisma.batch.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: todayEnd },
        OR: [{ endDate: null }, { endDate: { gte: todayStart } }],
      },
      select: {
        id: true,
        name: true,
        days: true,
        startTime: true,
        endTime: true,
        isOnline: true,
        meetingLink: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
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

    const batchesRunningToday = activeBatches.filter((batch) =>
      batch.days.includes(todayDayName)
    );

    const formattedRealSessions = sessions.map((session) => {
      let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';

      if (session.status === 'ONGOING') {
        status = 'ongoing';
      } else if (session.status === 'COMPLETED') {
        status = 'completed';
      } else if (currentHHMM >= session.startTime && currentHHMM <= session.endTime) {
        status = 'ongoing';
      } else if (currentHHMM > session.endTime) {
        status = 'completed';
      }

      return {
        id: session.id,
        name: session.topic ? `${session.batch.name} - ${session.topic}` : session.batch.name,
        teacher: getTeacherDisplayName(session.batch.teacher),
        startTime: session.startTime,
        endTime: session.endTime,
        isOnline: session.batch.isOnline,
        meetingLink: session.batch.meetingLink,
        room: session.room?.name ?? session.batch.room?.name ?? '',
        status,
        startTimeRaw: session.startTime,
        batchId: session.batchId,
      };
    });

    const realSessionBatchIds = new Set(sessions.map((session) => session.batchId));

    const virtualSessions = batchesRunningToday
      .filter((batch) => !realSessionBatchIds.has(batch.id))
      .map((batch) => {
        let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';

        if (currentHHMM >= batch.startTime && currentHHMM <= batch.endTime) {
          status = 'ongoing';
        } else if (currentHHMM > batch.endTime) {
          status = 'completed';
        }

        return {
          id: `virtual-${batch.id}`,
          name: batch.name,
          teacher: getTeacherDisplayName(batch.teacher),
          startTime: batch.startTime,
          endTime: batch.endTime,
          isOnline: batch.isOnline,
          meetingLink: batch.meetingLink,
          room: batch.room?.name ?? '',
          status,
          startTimeRaw: batch.startTime,
          batchId: batch.id,
        };
      });

    const allSessions = [...formattedRealSessions, ...virtualSessions].sort((a, b) =>
      a.startTimeRaw.localeCompare(b.startTimeRaw)
    );

    const result = allSessions.slice(0, 10).map((session) => ({
      id: session.id,
      name: session.name,
      teacher: session.teacher,
      startTime: session.startTime,
      endTime: session.endTime,
      isOnline: session.isOnline,
      meetingLink: session.meetingLink,
      room: session.room,
      status: session.status,
    }));

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
