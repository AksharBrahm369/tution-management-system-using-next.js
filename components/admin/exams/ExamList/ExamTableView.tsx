import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus, FilterX } from "lucide-react";

export default function ExamTableView({ exams, onView, onEnterMarks, onCreate, onReset, hasFilters }: any) {
  if (!exams || exams.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
            <FilterX className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {hasFilters ? "No exams match the current filters" : "No exams created yet"}
          </h3>
          <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
            {hasFilters
              ? "Try clearing the filters or searching with a different keyword."
              : "Create your first exam to start managing results, marks, and publishing workflow."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {hasFilters ? (
              <Button variant="outline" onClick={onReset} className="rounded-full">
                Clear Filters
              </Button>
            ) : null}
            <Button onClick={onCreate} className="gap-2 rounded-full">
              <Plus className="h-4 w-4" /> Create Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800 border-transparent";
      case "ONGOING":
        return "bg-green-100 text-green-800 border-transparent animate-pulse";
      case "COMPLETED":
        return "bg-slate-100 text-slate-800 border-transparent";
      case "RESULT_PENDING":
        return "bg-amber-100 text-amber-800 border-transparent";
      case "RESULT_PUBLISHED":
        return "bg-emerald-100 text-emerald-800 border-transparent";
      case "CANCELLED":
        return "bg-rose-100 text-rose-800 border-transparent";
      default:
        return "bg-gray-100 text-gray-800 border-transparent";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "UPCOMING";
      case "ONGOING":
        return "LIVE";
      case "COMPLETED":
        return "ENDED";
      case "RESULT_PENDING":
        return "RESULT PENDING";
      case "RESULT_PUBLISHED":
        return "PUBLISHED";
      default:
        return status.replace("_", " ");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <Table>
        <TableHeader className="bg-slate-50 dark:bg-slate-950/40">
          <TableRow>
            <TableHead>Code & Title</TableHead>
            <TableHead>Subject & Batch</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam: any) => (
            <TableRow key={exam.id}>
              <TableCell>
                <div className="font-medium text-gray-900 dark:text-gray-100">{exam.title}</div>
                <div className="text-xs text-gray-500">{exam.code}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{exam.subject?.name}</div>
                <div className="text-xs text-gray-500">{exam.batch?.name}</div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {format(new Date(exam.examDate), "dd MMM yyyy")}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{exam.type.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(exam.status)} font-medium`} variant="outline">
                  {getStatusLabel(exam.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">{exam.studentCount ?? exam._count?.results ?? 0} students</div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Open actions for ${exam.title}`}>
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onView(exam.id)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEnterMarks(exam.id)}>
                      <Edit className="mr-2 h-4 w-4" /> Enter Marks
                    </DropdownMenuItem>
                    {exam.status === "RESULT_PUBLISHED" && (
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" /> Download Results
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
