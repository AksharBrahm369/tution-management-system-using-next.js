export type EnquirySource =
  | "WALK_IN"
  | "PHONE_CALL"
  | "WHATSAPP"
  | "WEBSITE"
  | "SOCIAL_MEDIA"
  | "REFERRAL"
  | "NEWSPAPER"
  | "PAMPHLET"
  | "OTHER";

export type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "DEMO_SCHEDULED"
  | "DEMO_DONE"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "CONVERTED"
  | "LOST"
  | "ON_HOLD";

export type EnquiryPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type FollowUpType = "CALL" | "WHATSAPP" | "EMAIL" | "VISIT" | "DEMO";
export type FollowUpStatus = "PENDING" | "COMPLETED" | "MISSED" | "RESCHEDULED";
export type DemoStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface EnquiryFollowUp {
  id: string;
  type: FollowUpType;
  scheduledAt: string;
  completedAt: string | null;
  status: FollowUpStatus;
  notes: string | null;
  outcome: string | null;
  nextFollowUpAt: string | null;
  doneBy: string | null;
  createdAt: string;
}

export interface EnquiryDemoClass {
  id: string;
  batchId: string | null;
  batchName?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  status: DemoStatus;
  teacherNotes: string | null;
  parentFeedback: string | null;
  interested: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryListItem {
  id: string;
  enquiryNumber: string;
  studentName: string;
  studentAge: number | null;
  studentClass: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  address: string | null;
  interestedIn: string[];
  preferredBatch: string | null;
  preferredTime: string | null;
  source: EnquirySource;
  sourceDetail: string | null;
  referredBy: string | null;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  assignedTo: string | null;
  assignedAt: string | null;
  isConverted: boolean;
  convertedAt: string | null;
  studentId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  followUpCount: number;
  demoCount: number;
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  latestDemoAt: string | null;
}

export interface EnquiryDetailData extends EnquiryListItem {
  followUps: EnquiryFollowUp[];
  demoClasses: EnquiryDemoClass[];
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
  }>;
  convertedStudent?: {
    id: string;
    studentCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
  } | null;
}

export interface EnquiryStats {
  total: number;
  newToday: number;
  followUpsDue: number;
  convertedThisMonth: number;
  conversionRate: number;
}

export interface EnquiryListResponse {
  enquiries: EnquiryListItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: EnquiryStats;
}

export interface EnquiryAnalyticsResponse {
  sourceAnalysis: Array<{ name: string; value: number }>;
  conversionFunnel: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ month: string; enquiries: number; conversions: number }>;
  conversionRate: {
    thisMonth: number;
    lastMonth: number;
    bestMonth: number;
    bestMonthName: string;
  };
}

export interface EnquiryFiltersState {
  search: string;
  status: string;
  source: string;
  assignedTo: string;
  from: string;
  to: string;
}
