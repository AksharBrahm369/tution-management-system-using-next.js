import { prisma } from "@/lib/prisma";

export const DEFAULT_WORKING_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

export const DEFAULT_WORKING_HOURS = {
  openingTime: "09:00",
  closingTime: "18:00",
};

export function createDefaultSettings() {
  return {
    name: "TuitionPro Demo Institute",
    tagline: "Smart tuition management made simple",
    description: "Default institute profile for TuitionPro.",
    logo: null,
    favicon: null,
    phone: "9876543210",
    alternatePhone: null,
    email: "info@tuitionpro.demo",
    website: "https://tuitionpro.demo",
    addressLine1: "Demo Road",
    addressLine2: "Near Main Market",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380001",
    country: "India",
    currentAcademicYear: "2025-26",
    academicYears: ["2024-25", "2025-26"],
    workingDays: [...DEFAULT_WORKING_DAYS],
    workingHours: DEFAULT_WORKING_HOURS,
    gstEnabled: false,
    gstNumber: null,
    gstPercentage: 18,
    panNumber: null,
    receiptPrefix: "RCP",
    receiptStartNumber: "001",
    receiptFooterText: null,
    razorpayKeyId: null,
    razorpayKeySecret: null,
    razorpayMode: "TEST",
    twilioAccountSid: null,
    twilioAuthToken: null,
    twilioWhatsAppNumber: null,
    cloudinaryCloudName: null,
    cloudinaryApiKey: null,
    cloudinaryApiSecret: null,
    firebaseProjectId: null,
    firebaseApiKey: null,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    passwordExpiryDays: 90,
    sessionTimeoutMinutes: 30,
    rememberMeDays: 7,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 30,
    twoFactorEnabled: false,
    autoBackupEnabled: false,
    backupFrequency: "WEEKLY",
    backupTime: null,
    backupRetention: 10,
    currency: "INR",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12H",
    language: "EN",
    timezone: "Asia/Kolkata",
    primaryColor: "#2563EB",
    secondaryColor: "#10B981",
    onlinePaymentEnabled: false,
    qrAttendanceEnabled: true,
    parentPortalEnabled: true,
    studentPortalEnabled: true,
  };
}

export async function getOrCreateInstituteSettings() {
  const existing = await prisma.instituteSettings.findFirst();
  if (existing) {
    return existing;
  }

  return prisma.instituteSettings.create({ data: createDefaultSettings() });
}

export function normalizeOptional(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function academicYearStatus(isCurrent: boolean, isActive: boolean) {
  if (!isActive) return "Inactive";
  if (isCurrent) return "Current";
  return "Active";
}