DO $$
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL
     AND to_regclass('public.institutes') IS NULL THEN
    ALTER TABLE "tenants" RENAME TO "institutes";
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "institutes" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT,
  "ownerId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "institutes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "institutes" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "institutes" ALTER COLUMN "slug" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "institutes_slug_key" ON "institutes"("slug");
CREATE INDEX IF NOT EXISTS "institutes_ownerId_idx" ON "institutes"("ownerId");

INSERT INTO "institutes" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('legacy-default-institute', 'Default Institute', 'default-institute', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

DO $$
DECLARE
  scoped_tables text[] := ARRAY[
    'users',
    'sessions',
    'otp_verifications',
    'activity_logs',
    'password_reset_tokens',
    'notifications',
    'enquiries',
    'follow_ups',
    'demo_classes',
    'dashboard_alerts',
    'institute_settings',
    'academic_years',
    'backup_records',
    'students',
    'standards',
    'parents',
    'emergency_contacts',
    'medical_info',
    'student_documents',
    'sibling_links',
    'attendance',
    'attendance_sessions',
    'attendance_alerts',
    'attendance_notifications',
    'fee_structures',
    'fee_records',
    'fee_payments',
    'discounts',
    'scholarships',
    'fee_reminders',
    'refunds',
    'online_payment_orders',
    'announcements',
    'reports',
    'report_runs',
    'analytics_snapshots',
    'student_progress_reports',
    'ptm_meetings',
    'ptm_slots',
    'parent_feedbacks',
    'teacher_performance_reports',
    'exams',
    'exam_results',
    'exam_questions',
    'student_answers',
    'online_attempts',
    'grade_configs',
    'grade_ranges',
    'report_cards',
    'performance_analysis',
    'student_activities',
    'teachers',
    'subjects',
    'study_materials',
    'teacher_subjects',
    'teacher_standard_subjects',
    'teacher_attendance',
    'teacher_leaves',
    'salary_records',
    'teacher_documents',
    'teacher_performance',
    'rooms',
    'batches',
    'batch_enrollments',
    'timetable_slots',
    'class_sessions',
    'holidays',
    'academic_calendar',
    'conflict_logs',
    'class_schedules'
  ];
  scoped_table text;
BEGIN
  FOREACH scoped_table IN ARRAY scoped_tables LOOP
    IF to_regclass(format('public.%I', scoped_table)) IS NOT NULL THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = scoped_table
          AND column_name = 'tenantId'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = scoped_table
          AND column_name = 'instituteId'
      ) THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN "tenantId" TO "instituteId"', scoped_table);
      END IF;

      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = scoped_table
          AND column_name = 'instituteId'
      ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN "instituteId" TEXT', scoped_table);
      END IF;

      EXECUTE format(
        'UPDATE %I SET "instituteId" = %L WHERE "instituteId" IS NULL',
        scoped_table,
        'legacy-default-institute'
      );

      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON %I ("instituteId")',
        scoped_table || '_instituteId_idx',
        scoped_table
      );
    END IF;
  END LOOP;
END $$;

DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'users_instituteId_fkey'
     ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_instituteId_fkey"
      FOREIGN KEY ("instituteId") REFERENCES "institutes"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF to_regclass('public.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'institutes_ownerId_fkey'
     ) THEN
    ALTER TABLE "institutes"
      ADD CONSTRAINT "institutes_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

UPDATE "institutes" i
SET "ownerId" = owner_user."id"
FROM (
  SELECT "id", "instituteId"
  FROM "users"
  WHERE "role" = 'SUPER_ADMIN' AND "instituteId" IS NOT NULL
  ORDER BY "createdAt" ASC
  LIMIT 1
) owner_user
WHERE i."id" = owner_user."instituteId"
  AND i."ownerId" IS NULL;
