import React from "react";
import ExamCard from "./ExamCard";

export default function ExamGridView({ exams, onView, onEnterMarks }: any) {
  if (!exams || exams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No exams found matching your criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {exams.map((exam: any) => (
        <ExamCard 
          key={exam.id} 
          exam={exam} 
          onView={onView} 
          onEnterMarks={onEnterMarks} 
        />
      ))}
    </div>
  );
}
