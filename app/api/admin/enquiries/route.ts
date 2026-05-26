import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { generateEnquiryNumber, notifySuperAdmins, sendEnquiryWhatsAppAcknowledgement, splitPersonName } from "@/lib/enquiry";
import { enquiryCreateSchema, enquiryFiltersSchema } from "@/lib/validations/enquiry";

export const runtime = "nodejs";

function parseNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildWhere(searchParams: URLSearchParams): Prisma.EnquiryWhereInput {
  const parsed = enquiryFiltersSchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    assignedTo: searchParams.get("assignedTo") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  const where: Prisma.EnquiryWhereInput = {};
  if (!parsed.success) {
    return where;
  }

  const filters = parsed.data;
  const search = filters.search?.trim();

  if (search) {
    where.OR = [
      { enquiryNumber: { contains: search, mode: "insensitive" } },
      { studentName: { contains: search, mode: "insensitive" } },
      { parentName: { contains: search, mode: "insensitive" } },
      { parentPhone: { contains: search, mode: "insensitive" } },
      { parentEmail: { contains: search, mode: "insensitive" } },
      { sourceDetail: { contains: search, mode: "insensitive" } },
      { referredBy: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filters.status) where.status = filters.status;
  if (filters.source) where.source = filters.source;
  if (filters.assignedTo) where.assignedTo = { contains: filters.assignedTo, mode: "insensitive" };
  if (filters.from || filters.to) {
    where.createdAt = {
      gte: filters.from,
      lte: filters.to,
    };
  }

  return where;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function mapEnquiry(enquiry: {
  id: string;
  enquiryNumber: string;
  studentName: string;
  studentAge: number | null;
  studentClass: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  address: string | null;
  interestedIn: string[];
  preferredBatch: string | null;
  preferredTime: string | null;
  source: string;
  sourceDetail: string | null;
  referredBy: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  assignedAt: Date | null;
  isConverted: boolean;
  convertedAt: Date | null;
  studentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  followUps: Array<{ scheduledAt: Date; status: string; completedAt: Date | null }>;
  demoClasses: Array<{ createdAt: Date; scheduledDate: Date }>;
}) {
  const sortedFollowUps = [...enquiry.followUps].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const pendingFollowUps = sortedFollowUps.filter((item) => item.status === "PENDING");
  const latestFollowUp = sortedFollowUps[sortedFollowUps.length - 1] ?? null;
  const latestDemo = [...enquiry.demoClasses].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null;

  return {
    id: enquiry.id,
    enquiryNumber: enquiry.enquiryNumber,
    studentName: enquiry.studentName,
    studentAge: enquiry.studentAge,
    studentClass: enquiry.studentClass,
    parentName: enquiry.parentName,
    parentPhone: enquiry.parentPhone,
    parentEmail: enquiry.parentEmail,
    address: enquiry.address,
    interestedIn: enquiry.interestedIn,
    preferredBatch: enquiry.preferredBatch,
    preferredTime: enquiry.preferredTime,
    source: enquiry.source,
    sourceDetail: enquiry.sourceDetail,
    referredBy: enquiry.referredBy,
    status: enquiry.status,
    priority: enquiry.priority,
    assignedTo: enquiry.assignedTo,
    assignedAt: toIso(enquiry.assignedAt),
    isConverted: enquiry.isConverted,
    convertedAt: toIso(enquiry.convertedAt),
    studentId: enquiry.studentId,
    notes: enquiry.notes,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
    followUpCount: enquiry.followUps.length,
    demoCount: enquiry.demoClasses.length,
    lastFollowUpAt: latestFollowUp ? latestFollowUp.scheduledAt.toISOString() : null,
    nextFollowUpAt: pendingFollowUps[0] ? pendingFollowUps[0].scheduledAt.toISOString() : null,
    latestDemoAt: latestDemo ? latestDemo.scheduledDate.toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseNumber(searchParams.get("page"), 1);
    const limit = parseNumber(searchParams.get("limit"), 12);
    const where = buildWhere(searchParams);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [enquiries, total, totalThisMonth, newToday, convertedThisMonth, followUpsDue] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          followUps: {
            orderBy: { scheduledAt: "asc" },
            take: 5,
          },
          demoClasses: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      }),
      prisma.enquiry.count({ where }),
      prisma.enquiry.count({ where: { createdAt: { gte: monthStart, lt: nextMonth } } }),
      prisma.enquiry.count({ where: { createdAt: { gte: todayStart, lt: now } } }),
      prisma.enquiry.count({ where: { isConverted: true, convertedAt: { gte: monthStart, lt: nextMonth } } }),
      prisma.followUp.count({ where: { status: "PENDING", scheduledAt: { lte: now } } }),
    ]);

    const items = enquiries.map(mapEnquiry);
    const conversionRate = totalThisMonth > 0 ? Math.round((convertedThisMonth / totalThisMonth) * 100) : 0;

    return NextResponse.json({
      enquiries: items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total,
        newToday,
        followUpsDue,
        convertedThisMonth,
        conversionRate,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json();
    const parsed = enquiryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const enquiryNumber = generateEnquiryNumber();

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryNumber,
        studentName: data.studentName.trim(),
        studentAge: data.studentAge ?? null,
        studentClass: data.studentClass || null,
        parentName: data.parentName.trim(),
        parentPhone: data.parentPhone.trim(),
        parentEmail: data.parentEmail || null,
        address: data.address || null,
        interestedIn: data.interestedIn,
        preferredBatch: data.preferredBatch || null,
        preferredTime: data.preferredTime || null,
        source: data.source,
        sourceDetail: data.sourceDetail || null,
        referredBy: data.referredBy || null,
        status: data.status ?? "NEW",
        priority: data.priority ?? "NORMAL",
        assignedTo: data.assignedTo || null,
        assignedAt: data.assignedTo ? new Date() : null,
        notes: data.notes || null,
      },
    });

    if (data.followUpScheduledAt) {
      await prisma.followUp.create({
        data: {
          enquiryId: enquiry.id,
          type: data.followUpType ?? "CALL",
          scheduledAt: data.followUpScheduledAt,
          status: "PENDING",
          notes: data.notes || null,
          doneBy: auth.userId,
        },
      });
    }

    await sendEnquiryWhatsAppAcknowledgement(data.parentName.trim(), data.parentPhone.trim());
    await notifySuperAdmins("New enquiry received", `${data.studentName} enquired from ${data.source.toLowerCase().replace(/_/g, " ")}.`, "/admin/enquiries");

    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
