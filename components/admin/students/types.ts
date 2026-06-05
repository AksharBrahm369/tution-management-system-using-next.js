export type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "GRADUATED"
  | "TRANSFERRED"
  | "ON_LEAVE";

export type StudentCategory = "WEAK" | "AVERAGE" | "GOOD" | "TOPPER";

export interface StudentBatch {
  id: string;
  name: string;
  subject?: string | null;
  teacherName?: string | null;
  schedule?: string | null;
}

export interface StudentListItem {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  profilePhoto: string | null;
  status: StudentStatus;
  category: StudentCategory;
  joiningDate: string;
  academicYear: string;
  city: string | null;
  batch: StudentBatch | null;
  attendancePercent: number;
  feeStatus: string;
  standard?: { id: string; name: string } | null;
  standardId?: string | null;
}

export interface StudentListResponse {
  students: StudentListItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
  };
}

export interface StudentProfileData {
  id: string;
  userId: string | null;
  studentCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string;
  bloodGroup: string | null;
  profilePhoto: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  previousSchool: string | null;
  previousClass: string | null;
  previousMarks: string | null;
  joiningDate: string;
  academicYear: string;
  status: StudentStatus;
  category: StudentCategory;
  referredBy: string | null;
  standard: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    email: string;
    isActive: boolean;
  } | null;
  parent: {
    id: string;
    userId?: string | null;
    fatherName: string | null;
    fatherPhone: string | null;
    fatherEmail: string | null;
    fatherOccup: string | null;
    motherName: string | null;
    motherPhone: string | null;
    motherEmail: string | null;
    motherOccup: string | null;
    guardianName: string | null;
    guardianPhone: string | null;
    guardianRel: string | null;
    primaryContact: string;
  } | null;
  batchEnrollments: Array<{
    id: string;
    batchId: string;
    joinDate: string;
    leaveDate: string | null;
    isActive: boolean;
    batch: StudentBatch;
  }>;
  attendance: Array<{
    id: string;
    classDate: string;
    status: string;
    remark: string | null;
  }>;
  feeRecords: Array<{
    id: string;
    receiptNumber: string;
    month: number;
    year: number;
    academicYear: string;
    baseFee: number;
    discountAmount: number;
    scholarshipAmount: number;
    lateFee: number;
    otherCharges: number;
    gstAmount: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: string;
    paidDate: string | null;
    dueDate: string | null;
    batch: StudentBatch;
    payments: Array<{
      id: string;
      paymentNumber: string;
      amount: number;
      paymentMode: string;
      status: string;
      paidAt: string;
      collectedBy: string;
      notes: string | null;
    }>;
  }>;
  examResults: Array<{
    id: string;
    examName: string;
    subject: string;
    score: number;
    totalMarks: number;
    examDate: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    fileUrl: string;
    fileSize: string | null;
    uploadedAt: string;
  }>;
  emergencyContacts: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
    isVerified: boolean;
  }>;
  medicalInfo: {
    id: string;
    allergies: string | null;
    medications: string | null;
    conditions: string | null;
    doctorName: string | null;
    doctorPhone: string | null;
    insuranceInfo: string | null;
    extraNotes: string | null;
  } | null;
  siblings: Array<{
    siblingId: string;
    sibling: {
      id: string;
      studentCode: string;
      firstName: string;
      lastName: string;
      status: StudentStatus;
    };
  }>;
  siblingOf: Array<{
    studentId: string;
    student: {
      id: string;
      studentCode: string;
      firstName: string;
      lastName: string;
      status: StudentStatus;
    };
  }>;
  attendancePercent: number;
  feesPaid: number;
  pendingFees: number;
  currentBatch: StudentBatch | null;
}

export interface StudentFiltersState {
  search: string;
  status: string;
  category: string;
  batchId: string;
  academicYear: string;
  standardId: string;
}
