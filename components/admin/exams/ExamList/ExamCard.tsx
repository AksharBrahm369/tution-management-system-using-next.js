import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Calendar, Clock, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

export default function ExamCard({ exam, onView, onEnterMarks }: any) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-transparent";
      case "ONGOING":
        return "bg-green-100 text-green-850 dark:bg-green-900/40 dark:text-green-300 border-transparent animate-pulse";
      case "COMPLETED":
        return "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-350 border-transparent";
      case "RESULT_PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-transparent";
      case "RESULT_PUBLISHED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-transparent";
      case "CANCELLED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-transparent";
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

  const progress = exam._count?.results || 0;
  // Approximating total students as max if not available
  const total = 30;
  const progressPercent = Math.min(100, (progress / total) * 100);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Badge className={`${getStatusColor(exam.status)} font-medium`} variant="outline">
              {getStatusLabel(exam.status)}
            </Badge>
            <Badge variant="secondary" className="ml-2">
              {exam.type.replace("_", " ")}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 -mt-2" aria-label={`Open actions for ${exam.title}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onView(exam.id)}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEnterMarks(exam.id)}>Enter Marks</DropdownMenuItem>
              <DropdownMenuItem>Edit Exam</DropdownMenuItem>
              {exam.status === "RESULT_PUBLISHED" && (
                <DropdownMenuItem>Download Results</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold text-lg line-clamp-1 mb-1">{exam.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{exam.code}</p>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span>{exam.subject?.name || "Subject"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <span>{exam.batch?.name || "Batch"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span>{format(new Date(exam.examDate), "dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <span>{exam.duration ? `${exam.duration} mins` : "TBD"} | Total: {exam.totalMarks}</span>
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Results entered</span>
            <span>{progress}/{total}</span>
          </div>
          <Progress value={progressPercent} className="h-2 mb-4" />
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onView(exam.id)}>
              View
            </Button>
            <Button className="flex-1" onClick={() => onEnterMarks(exam.id)}>
              Marks
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
