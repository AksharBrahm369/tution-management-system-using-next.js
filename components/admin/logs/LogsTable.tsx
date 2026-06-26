"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityLogRow } from "@/types/activityLog";
import { formatEnum } from "@/lib/utils";


interface LogsTableProps {
  logs: ActivityLogRow[];
  highlightIds: Set<string>;
  onViewDetails: (log: ActivityLogRow) => void;
  isLoading: boolean;
}

const SEVERITY_ICON: Record<string, string> = {
  INFO: "🔵",
  WARNING: "🟡",
  ERROR: "🔴",
  CRITICAL: "⚫",
};

function roleBadgeVariant(role: string | null): "default" | "secondary" {
  if (role === "SUPER_ADMIN") return "default";
  return "secondary";
}

export default function LogsTable({
  logs,
  highlightIds,
  onViewDetails,
  isLoading,
}: LogsTableProps) {
  if (isLoading) {
    return (
      <div className="tp-card p-12 text-center text-slate-500">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="mt-3 text-sm font-medium">Loading activity logs...</p>
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="tp-card p-12 text-center text-slate-500">
        No activity logs yet.
      </div>
    );
  }

  return (
    <div className="tp-table-wrap animate-fade-up overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isNew = highlightIds.has(log.id);
            return (
              <TableRow
                key={log.id}
                className={isNew ? "animate-pulse bg-emerald-50/80 dark:bg-emerald-950/30" : undefined}
              >
                <TableCell className="text-lg">{SEVERITY_ICON[log.severity] ?? "🔵"}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-slate-600">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">
                    {log.userName ?? "System"}
                  </div>
                  {log.userRole && (
                    <Badge variant={roleBadgeVariant(log.userRole)} className="mt-1 text-[10px]">
                      {formatEnum(log.userRole)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {formatEnum(log.category)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm">{formatEnum(log.action)}</TableCell>
                <TableCell className="max-w-[160px] truncate text-sm text-slate-600">
                  {log.entityName ?? log.entityType ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={log.isSuccessful ? "secondary" : "default"}
                    className={log.isSuccessful ? "" : "bg-red-600 text-white"}
                  >
                    {log.isSuccessful ? "Success" : "Failed"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="ghost" size="sm" onClick={() => onViewDetails(log)}>
                    <Eye className="mr-1 h-4 w-4" />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
