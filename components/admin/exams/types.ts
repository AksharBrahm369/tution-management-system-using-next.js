export type ExamStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED" | "RESULT_PENDING" | "RESULT_PUBLISHED";
export type ExamType = "UNIT_TEST" | "MID_TERM" | "FINAL" | "MOCK_TEST" | "CLASS_TEST" | "ASSIGNMENT" | "PRACTICAL" | "ONLINE_TEST";

export interface ExamStudent {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string | null;
}

export interface ExamBatch {
  id: string;
  name: string;
  code: string;
  teacherId?: string;
  subjectId?: string;
  enrollments?: Array<{ id: string; student?: ExamStudent }>;
}

export interface ExamSubject {
  id: string;
  name: string;
  code: string;
}

export interface ExamQuestion {
  id?: string;
  questionNumber: number;
  questionText: string;
  questionType: string;
  marks: number;
  negativeMarks: number;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctOption?: string | null;
  modelAnswer?: string | null;
  answerKeyPoints: string[];
  topic?: string | null;
  difficulty: string;
  studentAnswers?: Array<{ isCorrect: boolean | null; marksAwarded: number | null }>;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  batchId: string;
  marksObtained: number | null;
  totalMarks: number;
  percentage: number | null;
  grade: string | null;
  gradePoint: number | null;
  batchRank: number | null;
  overallRank: number | null;
  status: string;
  isAbsent: boolean;
  isDisqualified: boolean;
  teacherRemarks: string | null;
  strengthAreas: string[];
  weakAreas: string[];
  student: ExamStudent;
}

export interface ExamItem {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  type: ExamType;
  batchId: string;
  subjectId: string;
  academicYear: string;
  examDate: string;
  startTime?: string | null;
  endTime?: string | null;
  duration?: number | null;
  totalMarks: number;
  passingMarks: number;
  hasNegativeMarking: boolean;
  negativeMarkValue: number;
  gradingSystem: string;
  status: ExamStatus;
  isResultPublished: boolean;
  resultPublishedAt?: string | null;
  batch: ExamBatch;
  subject: ExamSubject;
  results: ExamResult[];
  questions?: ExamQuestion[];
  studentCount?: number;
  enteredCount?: number;
  summary?: {
    studentCount: number;
    enteredCount: number;
    pendingCount: number;
    highest: number;
    lowest: number;
    average: number;
    passCount: number;
    failCount: number;
    absentCount: number;
  };
}

export interface ExamListResponse {
  exams: ExamItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    upcoming: number;
    ongoing: number;
    resultPending: number;
    published: number;
    thisMonth: number;
  };
}

export interface BatchOption {
  id: string;
  name: string;
  code: string;
  subjectId: string;
  subject?: ExamSubject;
  enrollments?: Array<{ id: string }>;
}

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
}
