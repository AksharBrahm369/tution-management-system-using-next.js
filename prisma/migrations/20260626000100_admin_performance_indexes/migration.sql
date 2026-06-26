CREATE INDEX IF NOT EXISTS "students_institute_status_createdAt_idx"
  ON "students" ("instituteId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "students_institute_standard_createdAt_idx"
  ON "students" ("instituteId", "standardId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "teachers_institute_status_createdAt_idx"
  ON "teachers" ("instituteId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "batches_institute_status_standard_idx"
  ON "batches" ("instituteId", "status", "standardId");

CREATE INDEX IF NOT EXISTS "batches_institute_standard_createdAt_idx"
  ON "batches" ("instituteId", "standardId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "batch_enrollments_institute_student_active_idx"
  ON "batch_enrollments" ("instituteId", "studentId", "isActive");

CREATE INDEX IF NOT EXISTS "batch_enrollments_institute_batch_active_idx"
  ON "batch_enrollments" ("instituteId", "batchId", "isActive");

CREATE INDEX IF NOT EXISTS "fee_records_institute_month_year_idx"
  ON "fee_records" ("instituteId", "month", "year");

CREATE INDEX IF NOT EXISTS "fee_records_institute_status_createdAt_idx"
  ON "fee_records" ("instituteId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "fee_records_institute_pending_idx"
  ON "fee_records" ("instituteId", "pendingAmount")
  WHERE "pendingAmount" > 0;

CREATE INDEX IF NOT EXISTS "fee_records_institute_student_status_idx"
  ON "fee_records" ("instituteId", "studentId", "status");

CREATE INDEX IF NOT EXISTS "fee_payments_institute_status_paidAt_idx"
  ON "fee_payments" ("instituteId", "status", "paidAt" DESC);

CREATE INDEX IF NOT EXISTS "attendance_institute_date_idx"
  ON "attendance" ("instituteId", "date" DESC);

CREATE INDEX IF NOT EXISTS "attendance_institute_status_date_idx"
  ON "attendance" ("instituteId", "status", "date" DESC);

CREATE INDEX IF NOT EXISTS "attendance_institute_student_date_idx"
  ON "attendance" ("instituteId", "studentId", "date" DESC);

CREATE INDEX IF NOT EXISTS "activity_logs_institute_createdAt_idx"
  ON "activity_logs" ("instituteId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "activity_logs_institute_category_createdAt_idx"
  ON "activity_logs" ("instituteId", "category", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "activity_logs_institute_severity_createdAt_idx"
  ON "activity_logs" ("instituteId", "severity", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "activity_logs_institute_user_createdAt_idx"
  ON "activity_logs" ("instituteId", "userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "study_materials_institute_createdAt_idx"
  ON "study_materials" ("instituteId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "study_materials_institute_standard_createdAt_idx"
  ON "study_materials" ("instituteId", "standardId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "standards_institute_active_order_idx"
  ON "standards" ("instituteId", "isActive", "order");

CREATE INDEX IF NOT EXISTS "enquiries_institute_status_createdAt_idx"
  ON "enquiries" ("instituteId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "notifications_institute_user_createdAt_idx"
  ON "notifications" ("instituteId", "userId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "announcements_institute_createdAt_idx"
  ON "announcements" ("instituteId", "createdAt" DESC);
