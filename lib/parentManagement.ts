import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ParentListFilters = {
  search?: string;
  batchId?: string;
  loginStatus?: "ALL" | "ACTIVE" | "NO_LOGIN";
};

export async function listParents(filters: ParentListFilters) {
  const where: Prisma.ParentWhereInput = {};
  const search = filters.search?.trim();

  if (search) {
    where.OR = [
      { fatherName: { contains: search, mode: "insensitive" } },
      { motherName: { contains: search, mode: "insensitive" } },
      { guardianName: { contains: search, mode: "insensitive" } },
      { fatherPhone: { contains: search, mode: "insensitive" } },
      { motherPhone: { contains: search, mode: "insensitive" } },
      { guardianPhone: { contains: search, mode: "insensitive" } },
      { fatherEmail: { contains: search, mode: "insensitive" } },
      { motherEmail: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (filters.batchId) {
    where.students = {
      some: {
        batchEnrollments: {
          some: {
            batchId: filters.batchId,
            isActive: true,
          },
        },
      },
    };
  }

  if (filters.loginStatus === "ACTIVE") {
    where.userId = { not: null };
  }

  if (filters.loginStatus === "NO_LOGIN") {
    where.userId = null;
  }

  const parents = await prisma.parent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, isActive: true, lastLogin: true, createdAt: true } },
      students: {
        include: {
          batchEnrollments: {
            where: { isActive: true },
            include: { batch: { select: { id: true, name: true, code: true } } },
          },
        },
      },
    },
  });

  const userIds = parents.map((parent) => parent.userId).filter((value): value is string => Boolean(value));
  const unreadByUser = userIds.length
    ? await prisma.notification.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, isRead: false },
        _count: { _all: true },
      })
    : [];

  const unreadMap = new Map(unreadByUser.map((row) => [row.userId, row._count._all]));

  return parents.map((parent) => ({
    ...parent,
    unreadMessages: parent.userId ? unreadMap.get(parent.userId) ?? 0 : 0,
    loginStatus: parent.userId ? (parent.user?.isActive ? "ACTIVE" : "DISABLED") : "NO_LOGIN",
    childCount: parent.students.length,
  }));
}

export async function getParentProfile(parentId: string) {
  const parent = await prisma.parent.findUnique({
    where: { id: parentId },
    include: {
      user: { select: { id: true, email: true, isActive: true, lastLogin: true, createdAt: true, updatedAt: true } },
      students: {
        include: {
          batchEnrollments: {
            where: { isActive: true },
            include: { batch: { select: { id: true, name: true, code: true } } },
          },
          feeRecords: { orderBy: { createdAt: "desc" }, take: 12 },
          examResults: {
            orderBy: { createdAt: "desc" },
            take: 6,
            include: {
              exam: { select: { title: true, examDate: true, type: true, totalMarks: true } },
            },
          },
        },
      },
      ptmSlots: {
        orderBy: { createdAt: "desc" },
        include: {
          meeting: true,
          student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      feedbacks: {
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!parent) {
    return null;
  }

  const batchIds = parent.students
    .flatMap((student) => student.batchEnrollments.map((enrollment) => enrollment.batchId))
    .filter((value, index, list) => list.indexOf(value) === index);

  const [messages, ptmMeetings] = await Promise.all([
    parent.userId
      ? prisma.notification.findMany({
          where: { userId: parent.userId },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
    prisma.pTMMeeting.findMany({
      where: {
        OR: [{ isForAll: true }, ...(batchIds.length ? [{ batchId: { in: batchIds } }] : [])],
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        slots: {
          where: { parentId: parent.id },
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  const announcements = await prisma.announcement.findMany({
    where: {
      OR: [{ audience: "ALL" }, { audience: "PARENT" }],
      status: { in: ["PUBLISHED", "SCHEDULED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      message: true,
      audience: true,
      status: true,
      createdAt: true,
    },
  });

  const communication = [
    ...messages.map((item) => ({
      id: item.id,
      kind: "notification" as const,
      title: item.title,
      message: item.message,
      status: item.isRead ? "Read" : "Unread",
      createdAt: item.createdAt,
    })),
    ...announcements.map((item) => ({
      id: item.id,
      kind: "announcement" as const,
      title: item.title,
      message: item.message,
      status: item.status,
      createdAt: item.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    ...parent,
    messages,
    announcements,
    communication,
    ptmMeetings,
  };
}

export async function listPTMMeetings() {
  return prisma.pTMMeeting.findMany({
    orderBy: { meetingDate: "asc" },
    include: {
      slots: {
        include: {
          parent: { select: { id: true, fatherName: true, motherName: true, guardianName: true } },
          student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });
}

export async function listParentFeedback() {
  return prisma.parentFeedback.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { id: true, fatherName: true, motherName: true, guardianName: true } },
      student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export function getParentDisplayName(parent: { fatherName?: string | null; motherName?: string | null; guardianName?: string | null }) {
  return parent.fatherName || parent.motherName || parent.guardianName || "Parent";
}

export function getChildDisplayName(child: { firstName: string; lastName: string }) {
  return `${child.firstName} ${child.lastName}`.trim();
}
