import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrCreateInstituteSettings, normalizeOptional } from "@/lib/settings";
import { instituteSettingsSchema } from "@/lib/validations/settings";
import { logActivityFromRequest } from "@/lib/activityLogger";

export const runtime = "nodejs";

function mapSettings(settings: Awaited<ReturnType<typeof getOrCreateInstituteSettings>>) {
  return {
    ...settings,
    workingHours: settings.workingHours ?? { openingTime: "09:00", closingTime: "18:00" },
  };
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const [settings, academicYears, backups] = await Promise.all([
      getOrCreateInstituteSettings(),
      prisma.academicYear.findMany({ orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] }),
      prisma.backupRecord.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    return NextResponse.json({
      settings: mapSettings(settings),
      academicYears,
      backups,
      integrations: {
        twilio: {
          connected: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) || Boolean(settings.twilioAccountSid && settings.twilioAuthToken),
          maskedAccountSid: process.env.TWILIO_ACCOUNT_SID 
            ? `${process.env.TWILIO_ACCOUNT_SID.slice(0, 4)}••••${process.env.TWILIO_ACCOUNT_SID.slice(-4)}` 
            : settings.twilioAccountSid 
              ? `${settings.twilioAccountSid.slice(0, 4)}••••${settings.twilioAccountSid.slice(-4)}` 
              : null,
        },
        cloudinary: {
          connected: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) || Boolean(settings.cloudinaryCloudName && settings.cloudinaryApiKey),
          cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? settings.cloudinaryCloudName ?? null,
        },
        firebase: {
          connected: Boolean(process.env.FIREBASE_PROJECT_ID) || Boolean(settings.firebaseProjectId),
          projectId: process.env.FIREBASE_PROJECT_ID ?? settings.firebaseProjectId ?? null,
        },
        razorpay: {
          connected: (Boolean(process.env.RAZORPAY_KEY_ID) && Boolean(process.env.RAZORPAY_KEY_SECRET)) || (Boolean(settings.razorpayKeyId) && Boolean(settings.razorpayKeySecret)),
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin(request);
    const body = await request.json();
    const parsed = instituteSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const settings = await getOrCreateInstituteSettings();

    const updated = await prisma.instituteSettings.update({
      where: { id: settings.id },
      data: {
        name: data.name.trim(),
        tagline: normalizeOptional(data.tagline),
        description: normalizeOptional(data.description),
        logo: normalizeOptional(data.logo),
        favicon: normalizeOptional(data.favicon),
        phone: normalizeOptional(data.phone),
        alternatePhone: normalizeOptional(data.alternatePhone),
        email: normalizeOptional(data.email),
        website: normalizeOptional(data.website),
        addressLine1: normalizeOptional(data.addressLine1),
        addressLine2: normalizeOptional(data.addressLine2),
        city: normalizeOptional(data.city),
        state: normalizeOptional(data.state),
        pincode: normalizeOptional(data.pincode),
        country: data.country,
        currentAcademicYear: data.currentAcademicYear.trim(),
        academicYears: data.academicYears,
        workingDays: data.workingDays,
        workingHours: data.workingHours
          ? (data.workingHours as Prisma.InputJsonValue)
          : Prisma.DbNull,
        gstEnabled: data.gstEnabled,
        gstNumber: normalizeOptional(data.gstNumber),
        gstPercentage: data.gstPercentage,
        panNumber: normalizeOptional(data.panNumber),
        receiptPrefix: data.receiptPrefix,
        receiptStartNumber: data.receiptStartNumber,
        receiptFooterText: normalizeOptional(data.receiptFooterText),
        razorpayKeyId: normalizeOptional(data.razorpayKeyId),
        razorpayKeySecret: normalizeOptional(data.razorpayKeySecret),
        razorpayMode: data.razorpayMode,
        twilioAccountSid: normalizeOptional(data.twilioAccountSid),
        twilioAuthToken: normalizeOptional(data.twilioAuthToken),
        twilioWhatsAppNumber: normalizeOptional(data.twilioWhatsAppNumber),
        cloudinaryCloudName: normalizeOptional(data.cloudinaryCloudName),
        cloudinaryApiKey: normalizeOptional(data.cloudinaryApiKey),
        cloudinaryApiSecret: normalizeOptional(data.cloudinaryApiSecret),
        firebaseProjectId: normalizeOptional(data.firebaseProjectId),
        firebaseApiKey: normalizeOptional(data.firebaseApiKey),
        passwordMinLength: data.passwordMinLength,
        requireUppercase: data.requireUppercase,
        requireNumber: data.requireNumber,
        requireSpecialChar: data.requireSpecialChar,
        passwordExpiryDays: data.passwordExpiryDays,
        sessionTimeoutMinutes: data.sessionTimeoutMinutes,
        rememberMeDays: data.rememberMeDays,
        maxFailedAttempts: data.maxFailedAttempts,
        lockoutDurationMinutes: data.lockoutDurationMinutes,
        twoFactorEnabled: data.twoFactorEnabled,
        autoBackupEnabled: data.autoBackupEnabled,
        backupFrequency: data.backupFrequency,
        backupTime: normalizeOptional(data.backupTime),
        backupRetention: data.backupRetention,
        currency: data.currency,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        language: data.language,
        timezone: data.timezone,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        onlinePaymentEnabled: data.onlinePaymentEnabled,
        qrAttendanceEnabled: data.qrAttendanceEnabled,
        parentPortalEnabled: data.parentPortalEnabled,
        studentPortalEnabled: data.studentPortalEnabled,
      },
    });

    await logActivityFromRequest(request, {
      userId: auth.userId,
      action: "SETTINGS_UPDATED",
      category: "SETTINGS",
      severity: "INFO",
      description: "Institute settings updated",
      entityType: "InstituteSettings",
      entityId: updated.id,
      entityName: updated.name,
    });

    return NextResponse.json({ settings: mapSettings(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Forbidden") ? 403 : message.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}