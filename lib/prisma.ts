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
import { webcrypto } from "node:crypto";
import { getRequestInstituteId, isAuthScopeDisabled, setRequestInstitute } from "@/lib/institute";

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
} catch {
  // Fallback so the server doesn't crash on start, though queries will fail
  pool = new Pool();
}

const adapter = new PrismaPg(pool);
const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "fallback-secret-for-dev-only-replace-in-production";
const BETTER_AUTH_SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "better-auth-session_token",
  "__Secure-better-auth-session_token",
];

async function verifyBetterAuthCookie(value: string) {
  const signatureStartPos = value.lastIndexOf(".");
  if (signatureStartPos < 1) return null;

  const signedValue = value.substring(0, signatureStartPos);
  const signature = value.substring(signatureStartPos + 1);
  if (signature.length !== 44 || !signature.endsWith("=")) return null;

  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(BETTER_AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const isValid = await webcrypto.subtle.verify(
    "HMAC",
    key,
    Buffer.from(signature, "base64"),
    new TextEncoder().encode(signedValue)
  );

  return isValid ? signedValue : null;
}

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

  if (isAuthScopeDisabled()) {
    return null;
  }

  let signedToken: string | undefined;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    signedToken = BETTER_AUTH_SESSION_COOKIES.map(
      (name) => cookieStore.get(name)?.value
    ).find(Boolean);
  } catch {
    return null;
  }

  if (!signedToken) return null;

  try {
    const sessionToken = await verifyBetterAuthCookie(signedToken);
    if (!sessionToken) {
      throw new Error("Unauthorized: Invalid institute session");
    }

    const session = await basePrisma.session.findUnique({
      where: { token: sessionToken },
      select: {
        expiresAt: true,
        instituteId: true,
        user: {
          select: {
            instituteId: true,
            isActive: true,
          },
        },
      },
    });

    const instituteId = session?.instituteId || session?.user.instituteId;
    if (
      !session ||
      session.expiresAt <= new Date() ||
      !session.user.isActive ||
      !instituteId ||
      session.user.instituteId !== instituteId
    ) {
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
