import React from "react";
import { StudentListItem } from "../types";
import StudentCard from "./StudentCard";

interface StudentGridViewProps {
  students: StudentListItem[];
  onChangeStatus: (student: StudentListItem) => void;
  onDownloadId: (student: StudentListItem) => void;
  onDelete: (student: StudentListItem) => void;
}

const StudentGridView: React.FC<StudentGridViewProps> = ({ students, onChangeStatus, onDownloadId, onDelete }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onChangeStatus={onChangeStatus}
          onDownloadId={onDownloadId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default StudentGridView;
