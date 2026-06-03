export type SettingsSection =
  | "academics"
  | "profile"
  | "academic-years"
  | "gst"
  | "notifications"
  | "integrations"
  | "security"
  | "backup"
  | "data"
  | "about";

export interface InstituteSettingsRecord {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo: string | null;
  favicon: string | null;
  phone: string | null;
  alternatePhone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  country: string;
  currentAcademicYear: string;
  academicYears: string[];
  workingDays: string[];
  workingHours: { openingTime?: string; closingTime?: string } | null;
  gstEnabled: boolean;
  gstNumber: string | null;
  gstPercentage: number;
  panNumber: string | null;
  receiptPrefix: string;
  receiptStartNumber: string;
  receiptFooterText: string | null;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
  razorpayMode: string;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioWhatsAppNumber: string | null;
  cloudinaryCloudName: string | null;
  cloudinaryApiKey: string | null;
  cloudinaryApiSecret: string | null;
  firebaseProjectId: string | null;
  firebaseApiKey: string | null;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  rememberMeDays: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  twoFactorEnabled: boolean;
  autoBackupEnabled: boolean;
  backupFrequency: string;
  backupTime: string | null;
  backupRetention: number;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  timezone: string;
  primaryColor: string;
  secondaryColor: string;
  onlinePaymentEnabled: boolean;
  qrAttendanceEnabled: boolean;
  parentPortalEnabled: boolean;
  studentPortalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYearRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackupRecord {
  id: string;
  fileName: string;
  fileUrl: string | null;
  fileSize: string | null;
  type: "MANUAL" | "SCHEDULED" | "AUTO";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  triggeredBy: string;
  completedAt: string | null;
  errorMsg: string | null;
  createdAt: string;
}

export interface SettingsApiResponse {
  settings: InstituteSettingsRecord;
  academicYears: AcademicYearRecord[];
  backups: BackupRecord[];
  integrations: {
    twilio: { connected: boolean; maskedAccountSid: string | null };
    cloudinary: { connected: boolean; cloudName: string | null };
    firebase: { connected: boolean; projectId: string | null };
    razorpay: { connected: boolean };
  };
}