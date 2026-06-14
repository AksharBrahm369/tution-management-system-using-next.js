/**
 * TuitionPro - Prisma Client
 *
 * In production we keep a singleton.
 * In development we prefer a fresh client so schema changes made during
 * active work are picked up immediately instead of reusing a stale delegate.
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { jwtVerify } from "jose";
import { getRequestInstituteId, setRequestInstitute } from "@/lib/institute";

// Extend global type to hold the Prisma instance across hot reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize the database connection pool and Prisma adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes("[YOUR-PASSWORD]")) {
  console.warn(
    "⚠️ DATABASE_URL is not configured properly in .env! Please replace [YOUR-PASSWORD] with your actual password."
  );
}

// We only initialize the pool if it's a valid-looking URL to prevent ERR_INVALID_URL crashes
let pool;
try {
  pool = new Pool({ connectionString });
} catch (e) {
  // Fallback so the server doesn't crash on start, though queries will fail
  pool = new Pool();
}

const adapter = new PrismaPg(pool);
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-for-dev-only-replace-in-production"
);
const COOKIE_NAME = "tuitionpro_auth";

const isProduction = process.env.NODE_ENV === "production";
const cachedPrisma = globalForPrisma.prisma;
const INSTITUTE_SCOPED_MODELS = new Set([
  "User",
  "Session",
  "OTPVerification",
  "ActivityLog",
  "PasswordResetToken",
  "Notification",
  "Enquiry",
  "FollowUp",
  "DemoClass",
  "DashboardAlert",
  "InstituteSettings",
  "AcademicYear",
  "BackupRecord",
  "Student",
  "Standard",
  "Parent",
  "EmergencyContact",
  "MedicalInfo",
  "StudentDocument",
  "SiblingLink",
  "Attendance",
  "AttendanceSession",
  "AttendanceAlert",
  "AttendanceNotification",
  "FeeStructure",
  "FeeRecord",
  "FeePayment",
  "Discount",
  "Scholarship",
  "FeeReminder",
  "Refund",
  "OnlinePaymentOrder",
  "Announcement",
  "Report",
  "ReportRun",
  "AnalyticsSnapshot",
  "StudentProgressReport",
  "PTMMeeting",
  "PTMSlot",
  "ParentFeedback",
  "TeacherPerformanceReport",
  "Exam",
  "ExamResult",
  "ExamQuestion",
  "StudentAnswer",
  "OnlineAttempt",
  "GradeConfig",
  "GradeRange",
  "ReportCard",
  "PerformanceAnalysis",
  "StudentActivity",
  "Teacher",
  "Subject",
  "StudyMaterial",
  "TeacherSubject",
  "TeacherStandardSubject",
  "TeacherAttendance",
  "TeacherLeave",
  "SalaryRecord",
  "TeacherDocument",
  "TeacherPerformance",
  "Room",
  "Batch",
  "BatchEnrollment",
  "TimetableSlot",
  "ClassSession",
  "Holiday",
  "AcademicCalendar",
  "ConflictLog",
  "ClassSchedule",
]);

function andInstitute(where: unknown, instituteId: string) {
  if (!where || (typeof where === "object" && Object.keys(where).length === 0)) {
    return { instituteId };
  }

  return { AND: [where, { instituteId }] };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function scopeNestedWrites(value: unknown, instituteId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => scopeNestedWrites(item, instituteId));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const next: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "create" || key === "data") {
      next[key] = addInstituteToData(nestedValue, instituteId);
    } else if (key === "createMany" && isPlainObject(nestedValue)) {
      next[key] = {
        ...nestedValue,
        data: addInstituteToData(nestedValue.data, instituteId),
      };
    } else if (key === "upsert" && isPlainObject(nestedValue)) {
      next[key] = {
        ...nestedValue,
        create: addInstituteToData(nestedValue.create, instituteId),
      };
    } else {
      next[key] = scopeNestedWrites(nestedValue, instituteId);
    }
  }

  return next;
}

function addInstituteToData(data: unknown, instituteId: string): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => addInstituteToData(item, instituteId));
  }

  if (isPlainObject(data)) {
    const scoped = scopeNestedWrites(data, instituteId) as Record<string, unknown>;
    return { ...scoped, instituteId };
  }

  return data;
}

const basePrisma =
  (isProduction ? cachedPrisma : undefined) ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

async function getInstituteIdForQuery() {
  const currentInstituteId = getRequestInstituteId();
  if (currentInstituteId) {
    return currentInstituteId;
  }

  let token: string | undefined;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  } catch {
    return null;
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload.sub || payload.userId) as string | undefined;
    const instituteId = payload.instituteId as string | undefined;
    if (!userId || !instituteId) {
      throw new Error("Unauthorized: Invalid institute session");
    }

    const user = await basePrisma.user.findUnique({
      where: { id: userId },
      select: { instituteId: true, isActive: true },
    });

    if (!user?.isActive || user.instituteId !== instituteId) {
      throw new Error("Unauthorized: Invalid institute session");
    }

    setRequestInstitute(instituteId);
    return instituteId;
  } catch {
    throw new Error("Unauthorized: Invalid institute session");
  }
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const instituteId = await getInstituteIdForQuery();
        if (!instituteId || !model || !INSTITUTE_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        const nextArgs = { ...(args as Record<string, unknown>) };

        if (
          [
            "findMany",
            "findFirst",
            "count",
            "aggregate",
            "groupBy",
            "updateMany",
            "deleteMany",
          ].includes(operation)
        ) {
          nextArgs.where = andInstitute(nextArgs.where, instituteId);
        }

        if (["findUnique", "update", "delete"].includes(operation) && nextArgs.where) {
          nextArgs.where = {
            ...(nextArgs.where as Record<string, unknown>),
            instituteId,
          };
        }

        if (operation === "create" && nextArgs.data) {
          nextArgs.data = addInstituteToData(nextArgs.data, instituteId);
        }

        if (operation === "createMany" && nextArgs.data) {
          nextArgs.data = addInstituteToData(nextArgs.data, instituteId);
        }

        if (["update", "updateMany"].includes(operation) && nextArgs.data) {
          nextArgs.data = scopeNestedWrites(nextArgs.data, instituteId);
        }

        if (operation === "upsert") {
          if (nextArgs.where) {
            nextArgs.where = {
              ...(nextArgs.where as Record<string, unknown>),
              instituteId,
            };
          }
          if (nextArgs.create) {
            nextArgs.create = addInstituteToData(nextArgs.create, instituteId);
          }
          if (nextArgs.update) {
            nextArgs.update = scopeNestedWrites(nextArgs.update, instituteId);
          }
        }

        return query(nextArgs);
      },
    },
  },
});

// Persist only in production. In development we want schema changes
// like new models/fields to be reflected without stale client reuse.
if (isProduction) {
  globalForPrisma.prisma = basePrisma;
}

export default prisma;
