import type { LogCategory, LogSeverity, PrismaClient, Role } from "@prisma/client";

const ACTIONS: Array<{
  action: string;
  category: LogCategory;
  severity: LogSeverity;
  description: string;
  isSuccessful?: boolean;
}> = [
  { action: "USER_LOGGED_IN", category: "AUTH", severity: "INFO", description: "User logged in successfully" },
  { action: "USER_LOGGED_OUT", category: "AUTH", severity: "INFO", description: "User logged out" },
  { action: "LOGIN_FAILED", category: "AUTH", severity: "WARNING", description: "Login failed — invalid password", isSuccessful: false },
  { action: "LOGIN_FAILED", category: "AUTH", severity: "WARNING", description: "Login failed — unknown email", isSuccessful: false },
  { action: "ACCOUNT_LOCKED", category: "AUTH", severity: "CRITICAL", description: "Account locked after multiple failed attempts" },
  { action: "PASSWORD_RESET_REQUESTED", category: "AUTH", severity: "INFO", description: "Password reset requested" },
  { action: "PASSWORD_CHANGED", category: "AUTH", severity: "INFO", description: "Password changed successfully" },
  { action: "STUDENT_ADDED", category: "STUDENT", severity: "INFO", description: "New student enrolled" },
  { action: "STUDENT_EDITED", category: "STUDENT", severity: "INFO", description: "Student profile updated" },
  { action: "STUDENT_STATUS_CHANGED", category: "STUDENT", severity: "WARNING", description: "Student status changed" },
  { action: "STUDENT_DELETED", category: "STUDENT", severity: "WARNING", description: "Student record removed" },
  { action: "DOCUMENT_UPLOADED", category: "STUDENT", severity: "INFO", description: "Student document uploaded" },
  { action: "BATCH_ASSIGNED", category: "STUDENT", severity: "INFO", description: "Student assigned to batch" },
  { action: "TEACHER_ADDED", category: "TEACHER", severity: "INFO", description: "Teacher profile created" },
  { action: "TEACHER_EDITED", category: "TEACHER", severity: "INFO", description: "Teacher profile updated" },
  { action: "SALARY_GENERATED", category: "TEACHER", severity: "INFO", description: "Monthly salary generated" },
  { action: "SALARY_PAID", category: "TEACHER", severity: "INFO", description: "Salary payment recorded" },
  { action: "LEAVE_APPROVED", category: "TEACHER", severity: "INFO", description: "Teacher leave approved" },
  { action: "LEAVE_REJECTED", category: "TEACHER", severity: "WARNING", description: "Teacher leave rejected" },
  { action: "ATTENDANCE_MARKED", category: "ATTENDANCE", severity: "INFO", description: "Attendance marked for session" },
  { action: "ATTENDANCE_CORRECTED", category: "ATTENDANCE", severity: "WARNING", description: "Attendance record corrected" },
  { action: "QR_CODE_GENERATED", category: "ATTENDANCE", severity: "INFO", description: "QR attendance code generated" },
  { action: "FEE_COLLECTED", category: "FEE", severity: "INFO", description: "Fee payment collected" },
  { action: "FEE_WAIVED", category: "FEE", severity: "WARNING", description: "Fee amount waived" },
  { action: "DISCOUNT_ADDED", category: "FEE", severity: "INFO", description: "Discount applied to fee record" },
  { action: "REFUND_PROCESSED", category: "FEE", severity: "WARNING", description: "Fee refund processed" },
  { action: "EXAM_CREATED", category: "EXAM", severity: "INFO", description: "Exam scheduled" },
  { action: "MARKS_ENTERED", category: "EXAM", severity: "INFO", description: "Exam marks entered" },
  { action: "RESULT_PUBLISHED", category: "EXAM", severity: "INFO", description: "Exam results published" },
  { action: "SETTINGS_UPDATED", category: "SETTINGS", severity: "INFO", description: "Institute settings updated" },
  { action: "BACKUP_CREATED", category: "SETTINGS", severity: "INFO", description: "System backup created" },
  { action: "INTEGRATION_CONFIGURED", category: "SETTINGS", severity: "INFO", description: "Integration settings updated" },
  { action: "USER_CREATED", category: "USER_MANAGEMENT", severity: "INFO", description: "New user account created" },
  { action: "USER_DISABLED", category: "USER_MANAGEMENT", severity: "WARNING", description: "User account disabled" },
  { action: "PERMISSIONS_CHANGED", category: "USER_MANAGEMENT", severity: "WARNING", description: "User permissions updated" },
  { action: "ADMIN_PASSWORD_RESET", category: "USER_MANAGEMENT", severity: "CRITICAL", description: "Password reset by administrator" },
  { action: "ENQUIRY_CREATED", category: "ENQUIRY", severity: "INFO", description: "New enquiry received" },
  { action: "REPORT_EXPORTED", category: "REPORT", severity: "INFO", description: "Report exported" },
  { action: "SYSTEM_MAINTENANCE", category: "SYSTEM", severity: "INFO", description: "Scheduled maintenance completed" },
];

const ENTITY_TYPES = ["Student", "Teacher", "Batch", "Exam", "FeeRecord", "User", "Settings"];
const SAMPLE_IPS = ["192.168.1.10", "10.0.0.45", "203.0.113.88", "172.16.0.2", "198.51.100.5"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinDays(days: number): Date {
  const now = Date.now();
  const offset = Math.floor(Math.random() * days * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

export async function seedActivityLogs(
  prisma: PrismaClient,
  admin: { id: string; name: string; role: Role },
  teachers: Array<{ userId: string | null; name: string }>
): Promise<void> {
  const actors = [
    { id: admin.id, name: admin.name, role: admin.role as Role },
    ...teachers
      .filter((t): t is { userId: string; name: string } => Boolean(t.userId))
      .map((t) => ({ id: t.userId, name: t.name, role: "TEACHER" as Role })),
  ];

  if (!actors.length) return;

  const existing = await prisma.activityLog.count();
  if (existing >= 50) {
    console.log(`✓ Activity logs already seeded (${existing} records)`);
    return;
  }

  const logs = Array.from({ length: 100 }, (_, i) => {
    const template = randomItem(ACTIONS);
    const actor = randomItem(actors);
    const entityType = randomItem(ENTITY_TYPES);
    const createdAt = randomDateWithinDays(30);
    const isFailedLogin = template.action === "LOGIN_FAILED";
    const ip = randomItem(SAMPLE_IPS);

    return {
      userId: isFailedLogin && i % 3 === 0 ? null : actor.id,
      userName: isFailedLogin && i % 3 === 0 ? "unknown@example.com" : actor.name,
      userRole: isFailedLogin && i % 3 === 0 ? null : actor.role,
      ipAddress: ip,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      action: template.action,
      category: template.category,
      severity: template.severity,
      entityType,
      entityId: `seed-entity-${i}`,
      entityName: `${entityType} #${1000 + i}`,
      description: template.description,
      isSuccessful: template.isSuccessful ?? true,
      errorMessage: template.isSuccessful === false ? "Invalid credentials" : null,
      metadata: { source: "seed", index: i },
      createdAt,
    };
  });

  await prisma.activityLog.createMany({ data: logs });
  console.log("✓ Seeded 100 activity logs");
}
