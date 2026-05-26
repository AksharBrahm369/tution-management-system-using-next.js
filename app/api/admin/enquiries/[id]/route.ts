import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { enquiryUpdateSchema } from "@/lib/validations/enquiry";

type EnquiryFollowUpRow = {
  id: string;
  type: string;
  scheduledAt: Date;
  completedAt: Date | null;
  status: string;
  notes: string | null;
  outcome: string | null;
  nextFollowUpAt: Date | null;
  doneBy: string | null;
  createdAt: Date;
};

type EnquiryDemoClassRow = {
  id: string;
  batchId: string | null;
  scheduledDate: Date;
  scheduledTime: string;
  status: string;
  teacherNotes: string | null;
  parentFeedback: string | null;
  interested: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

type EnquiryRecord = {
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
  followUps: EnquiryFollowUpRow[];
  demoClasses: EnquiryDemoClassRow[];
};

type EnquiryClient = PrismaClient & {
  enquiry: {
    findUnique: (args: unknown) => Promise<EnquiryRecord | null>;
    update: (args: unknown) => Promise<EnquiryRecord>;
  };
  batch: {
    findMany: (args: unknown) => Promise<Array<{ id: string; name: string; code: string }>>;
  };
  student: {
    findUnique: (args: unknown) => Promise<{ id: string; studentCode: string; firstName: string; lastName: string } | null>;
  };
};

const enquiryDb = prisma as EnquiryClient;

export const runtime = "nodejs";

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function buildTimeline(enquiry: {
  createdAt: Date;
  assignedAt: Date | null;
  convertedAt: Date | null;
  status: string;
  followUps: Array<{ id: string; type: string; scheduledAt: Date; completedAt: Date | null; status: string; notes: string | null; outcome: string | null; doneBy: string | null; createdAt: Date }>;
  demoClasses: Array<{ id: string; scheduledDate: Date; scheduledTime: string; status: string; teacherNotes: string | null; parentFeedback: string | null; interested: boolean | null; createdAt: Date; updatedAt: Date }>;
}) {
  const items: Array<{ id: string; type: string; title: string; description: string; date: string }> = [
    {
      id: `created-${enquiry.createdAt.toISOString()}`,
      type: "STATUS",
      title: "Enquiry created",
      description: "Enquiry was registered in the system.",
      date: enquiry.createdAt.toISOString(),
    },
  ];

  if (enquiry.assignedAt) {
    items.push({
      id: `assigned-${enquiry.assignedAt.toISOString()}`,
      type: "ASSIGNMENT",
      title: "Assigned to staff",
      description: "Enquiry was assigned for follow-up.",
      date: enquiry.assignedAt.toISOString(),
    });
  }

  enquiry.followUps.forEach((followUp) => {
    items.push({
      id: followUp.id,
      type: "FOLLOW_UP",
      title: `${followUp.type} follow-up`,
      description: followUp.notes || followUp.outcome || "Follow-up recorded.",
      date: followUp.completedAt?.toISOString() || followUp.scheduledAt.toISOString(),
    });
  });

  enquiry.demoClasses.forEach((demoClass) => {
    items.push({
      id: demoClass.id,
      type: "DEMO",
      title: "Demo class scheduled",
      description: demoClass.teacherNotes || demoClass.parentFeedback || "Demo class recorded.",
      date: demoClass.createdAt.toISOString(),
    });
  });

  if (enquiry.convertedAt) {
    items.push({
      id: `converted-${enquiry.convertedAt.toISOString()}`,
      type: "CONVERSION",
      title: "Converted to student",
      description: "Enquiry was converted into an enrolled student.",
      date: enquiry.convertedAt.toISOString(),
    });
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const enquiry = await enquiryDb.enquiry.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { scheduledAt: "asc" },
        },
        demoClasses: {
          orderBy: { scheduledDate: "asc" },
        },
      },
    });

    if (!enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    }

    const batchIds: Array<string | null> = enquiry.demoClasses.map((item: EnquiryDemoClassRow) => item.batchId);
    const filteredBatchIds = batchIds.filter((value: string | null): value is string => Boolean(value));

    const batches = filteredBatchIds.length > 0
      ? await enquiryDb.batch.findMany({
          where: { id: { in: filteredBatchIds } },
          select: { id: true, name: true, code: true },
        })
      : [];

    const batchMap = new Map(batches.map((batch: { id: string; name: string; code: string }) => [batch.id, batch]));

    const convertedStudent = enquiry.studentId
      ? await enquiryDb.student.findUnique({
          where: { id: enquiry.studentId },
          select: { id: true, studentCode: true, firstName: true, lastName: true },
        })
      : null;

    const latestFollowUp = enquiry.followUps[enquiry.followUps.length - 1] ?? null;
    const nextFollowUp = enquiry.followUps.find((item: EnquiryFollowUpRow) => item.status === "PENDING") ?? null;
    const latestDemo = enquiry.demoClasses[enquiry.demoClasses.length - 1] ?? null;

    return NextResponse.json({
      enquiry: {
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
        nextFollowUpAt: nextFollowUp ? nextFollowUp.scheduledAt.toISOString() : null,
        latestDemoAt: latestDemo ? latestDemo.scheduledDate.toISOString() : null,
        followUps: enquiry.followUps.map((item: EnquiryFollowUpRow) => ({
          id: item.id,
          type: item.type,
          scheduledAt: item.scheduledAt.toISOString(),
          completedAt: toIso(item.completedAt),
          status: item.status,
          notes: item.notes,
          outcome: item.outcome,
          nextFollowUpAt: toIso(item.nextFollowUpAt),
          doneBy: item.doneBy,
          createdAt: item.createdAt.toISOString(),
        })),
        demoClasses: enquiry.demoClasses.map((item: EnquiryDemoClassRow) => ({
          id: item.id,
          batchId: item.batchId,
          batchName: item.batchId ? batchMap.get(item.batchId)?.name ?? batchMap.get(item.batchId)?.code ?? null : null,
          scheduledDate: item.scheduledDate.toISOString(),
          scheduledTime: item.scheduledTime,
          status: item.status,
          teacherNotes: item.teacherNotes,
          parentFeedback: item.parentFeedback,
          interested: item.interested,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
        timeline: buildTimeline(enquiry),
        convertedStudent: convertedStudent
          ? {
              id: convertedStudent.id,
              studentCode: convertedStudent.studentCode,
              firstName: convertedStudent.firstName,
              lastName: convertedStudent.lastName,
              fullName: `${convertedStudent.firstName} ${convertedStudent.lastName}`.trim(),
            }
          : null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = enquiryUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const enquiry = await enquiryDb.enquiry.update({
      where: { id },
      data: {
        studentName: data.studentName?.trim(),
        studentAge: data.studentAge ?? undefined,
        studentClass: data.studentClass === "" ? null : data.studentClass,
        parentName: data.parentName?.trim(),
        parentPhone: data.parentPhone?.trim(),
        parentEmail: data.parentEmail === "" ? null : data.parentEmail,
        address: data.address === "" ? null : data.address,
        interestedIn: data.interestedIn ?? undefined,
        preferredBatch: data.preferredBatch === "" ? null : data.preferredBatch,
        preferredTime: data.preferredTime === "" ? null : data.preferredTime,
        source: data.source ?? undefined,
        sourceDetail: data.sourceDetail === "" ? null : data.sourceDetail,
        referredBy: data.referredBy === "" ? null : data.referredBy,
        status: data.status ?? undefined,
        priority: data.priority ?? undefined,
        assignedTo: data.assignedTo === "" ? null : data.assignedTo,
        assignedAt: data.assignedTo ? new Date() : undefined,
        isConverted: data.isConverted ?? undefined,
        convertedAt: data.convertedAt === null ? null : data.convertedAt ?? undefined,
        studentId: data.studentId === null ? null : data.studentId ?? undefined,
        notes: data.notes === "" ? null : data.notes,
      },
    });

    return NextResponse.json({ enquiry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
