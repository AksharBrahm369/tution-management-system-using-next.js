import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExamTableView({ exams, onView, onEnterMarks }: any) {
  if (!exams || exams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No exams found matching your criteria.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING": return "bg-blue-100 text-blue-800";
      case "ONGOING": return "bg-green-100 text-green-800";
      case "RESULT_PENDING": return "bg-orange-100 text-orange-800";
      case "RESULT_PUBLISHED": return "bg-emerald-100 text-emerald-800";
      case "CANCELLED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
      <Table>
        <TableHeader>
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
                <Badge className={getStatusColor(exam.status)} variant="outline">
                  {exam.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">{exam._count?.results || 0} / 30</div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
