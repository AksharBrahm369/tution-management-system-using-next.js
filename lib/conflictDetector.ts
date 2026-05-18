import { prisma } from "@/lib/prisma";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

interface ConflictCheckParams {
  teacherId?: string;
  roomId?: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  excludeBatchId?: string;
}

interface TeacherConflict {
  batchId: string;
  batchName: string;
  batchCode: string;
  conflictingDays: DayOfWeek[];
}

interface RoomConflict {
  batchId: string;
  batchName: string;
  batchCode: string;
  roomName: string;
  conflictingDays: DayOfWeek[];
}

interface ConflictCheckResult {
  hasConflict: boolean;
  teacherConflicts: TeacherConflict[];
  roomConflicts: RoomConflict[];
}

function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  // Overlap if one starts before the other ends
  return s1 < e2 && s2 < e1;
}

function daysOverlap(days1: DayOfWeek[], days2: DayOfWeek[]): DayOfWeek[] {
  return days1.filter((d) => days2.includes(d));
}

export async function checkConflicts(
  params: ConflictCheckParams
): Promise<ConflictCheckResult> {
  const { teacherId, roomId, days, startTime, endTime, excludeBatchId } = params;
  const teacherConflicts: TeacherConflict[] = [];
  const roomConflicts: RoomConflict[] = [];

  if (teacherId) {
    const teacherBatches = await prisma.batch.findMany({
      where: {
        teacherId,
        status: { in: ["ACTIVE", "UPCOMING"] },
        ...(excludeBatchId ? { id: { not: excludeBatchId } } : {}),
      },
      select: {
        id: true,
        name: true,
        code: true,
        days: true,
        startTime: true,
        endTime: true,
      },
    });

    for (const batch of teacherBatches) {
      const overlapDays = daysOverlap(days, batch.days as DayOfWeek[]);
      if (overlapDays.length > 0) {
        if (timesOverlap(startTime, endTime, batch.startTime, batch.endTime)) {
          teacherConflicts.push({
            batchId: batch.id,
            batchName: batch.name,
            batchCode: batch.code,
            conflictingDays: overlapDays,
          });
        }
      }
    }
  }

  if (roomId) {
    const roomBatches = await prisma.batch.findMany({
      where: {
        roomId,
        status: { in: ["ACTIVE", "UPCOMING"] },
        ...(excludeBatchId ? { id: { not: excludeBatchId } } : {}),
      },
      select: {
        id: true,
        name: true,
        code: true,
        days: true,
        startTime: true,
        endTime: true,
        room: { select: { name: true } },
      },
    });

    for (const batch of roomBatches) {
      const overlapDays = daysOverlap(days, batch.days as DayOfWeek[]);
      if (overlapDays.length > 0) {
        if (timesOverlap(startTime, endTime, batch.startTime, batch.endTime)) {
          roomConflicts.push({
            batchId: batch.id,
            batchName: batch.name,
            batchCode: batch.code,
            roomName: batch.room?.name ?? "Unknown",
            conflictingDays: overlapDays,
          });
        }
      }
    }
  }

  return {
    hasConflict: teacherConflicts.length > 0 || roomConflicts.length > 0,
    teacherConflicts,
    roomConflicts,
  };
}

export async function getAvailableTeachers(params: {
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  excludeTeacherId?: string;
}) {
  const { days, startTime, endTime, excludeTeacherId } = params;

  const allTeachers = await prisma.teacher.findMany({
    where: {
      status: "ACTIVE",
      ...(excludeTeacherId ? { id: { not: excludeTeacherId } } : {}),
    },
    include: {
      batches: {
        where: { status: { in: ["ACTIVE", "UPCOMING"] } },
        select: { days: true, startTime: true, endTime: true },
      },
    },
  });

  return allTeachers.filter((teacher) => {
    const hasConflict = teacher.batches.some((batch) => {
      const overlap = daysOverlap(days, batch.days as DayOfWeek[]);
      return overlap.length > 0 && timesOverlap(startTime, endTime, batch.startTime, batch.endTime);
    });
    return !hasConflict;
  });
}

export async function getAvailableRooms(params: {
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  minCapacity?: number;
  excludeRoomId?: string;
}) {
  const { days, startTime, endTime, minCapacity, excludeRoomId } = params;

  const allRooms = await prisma.room.findMany({
    where: {
      isActive: true,
      ...(minCapacity ? { capacity: { gte: minCapacity } } : {}),
      ...(excludeRoomId ? { id: { not: excludeRoomId } } : {}),
    },
    include: {
      batches: {
        where: { status: { in: ["ACTIVE", "UPCOMING"] } },
        select: { days: true, startTime: true, endTime: true },
      },
    },
  });

  return allRooms.map((room) => {
    const isBooked = room.batches.some((batch) => {
      const overlap = daysOverlap(days, batch.days as DayOfWeek[]);
      return overlap.length > 0 && timesOverlap(startTime, endTime, batch.startTime, batch.endTime);
    });
    return { ...room, isBooked };
  });
}

export async function checkSubstituteAvailability(params: {
  teacherId: string;
  date: Date;
  startTime: string;
  endTime: string;
}): Promise<boolean> {
  const { teacherId, date, startTime, endTime } = params;
  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayOfWeek = dayNames[date.getDay()] as DayOfWeek;

  const conflictingBatches = await prisma.batch.findMany({
    where: {
      teacherId,
      days: { has: dayOfWeek },
      status: { in: ["ACTIVE", "UPCOMING"] },
    },
    select: { startTime: true, endTime: true },
  });

  return !conflictingBatches.some((b) =>
    timesOverlap(startTime, endTime, b.startTime, b.endTime)
  );
}
