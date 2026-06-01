import type { LogCategory, LogSeverity, Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export interface ActivityLogRow {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: Role | null;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  category: LogCategory;
  severity: LogSeverity;
  entityType: string | null;
  entityId: string | null;
  entityName: string | null;
  description: string;
  oldValue: Prisma.JsonValue;
  newValue: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  isSuccessful: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export interface ActivityLogsStats {
  today: number;
  errors: number;
  warnings: number;
  failedLogins: number;
}

export interface ActivityLogsListResponse {
  logs: ActivityLogRow[];
  total: number;
  page: number;
  limit: number;
  stats: ActivityLogsStats;
}

export interface SecurityEventsResponse {
  failedLoginsToday: number;
  accountLockouts: number;
  permissionChanges: number;
  settingsChanges: number;
  failedLoginAttempts: Array<{
    id: string;
    ipAddress: string | null;
    userName: string | null;
    description: string;
    createdAt: string;
  }>;
  suspiciousIps: Array<{
    ipAddress: string;
    count: number;
  }>;
}

export interface ActivityLogFilters {
  category?: string;
  severity?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
