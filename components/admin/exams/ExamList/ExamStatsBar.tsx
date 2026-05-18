import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle, Clock, CheckSquare } from "lucide-react";

export default function ExamStatsBar({ stats }: { stats: any }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-md">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Exams</p>
            <h4 className="text-2xl font-bold">{stats.total || 0}</h4>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-none shadow-md">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-orange-100 text-sm font-medium">Upcoming</p>
            <h4 className="text-2xl font-bold">{stats.upcoming || 0}</h4>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-md">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <CheckSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-purple-100 text-sm font-medium">Pending Results</p>
            <h4 className="text-2xl font-bold">{stats.resultPending || 0}</h4>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-md">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-emerald-100 text-sm font-medium">Published</p>
            <h4 className="text-2xl font-bold">{stats.published || 0}</h4>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
