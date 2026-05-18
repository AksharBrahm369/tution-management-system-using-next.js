import { ExamQuestion } from "../types";

export interface CreateExamForm {
  title: string;
  code: string;
  type: string;
  batchId: string;
  subjectId: string;
  academicYear: string;
  description: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  hasNegativeMarking: boolean;
  negativeMarkValue: number;
  gradingSystem: string;
  questions: ExamQuestion[];
}
