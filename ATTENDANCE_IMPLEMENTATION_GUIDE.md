# Attendance Module - Complete Implementation Guide

## Overview
This guide contains all necessary patterns, code structures, and detailed instructions for building the remaining Attendance Module components and API routes.

## Token: Patterns & Architecture

### API Route Pattern
All routes follow this structure:
```typescript
// 1. Authentication check
const payload = await validateJWT(req);
if (!payload) return 401;

// 2. Role verification  
if (payload.role !== "SUPER_ADMIN") return 403;

// 3. Validation
const validation = validateSchema(body);
if (!validation.success) return 400;

// 4. Database operations
const data = await prisma.model.operation();

// 5. Additional processing (notifications, calculations, etc)

// 6. Response
return NextResponse.json({ success: true, data });
```

### Component Pattern
All components follow this structure:
```typescript
'use client'; // If using hooks

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export function ComponentName() {
  // 1. State management
  const [filters, setFilters] = useState({});
  
  // 2. Data fetching
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      const res = await fetch(`/api/admin/attendance?${new URLSearchParams(filters)}`);
      return res.json();
    },
  });
  
  // 3. Mutations
  const mutation = useMutation({
    mutationFn: async (body) => {
      const res = await fetch('/api/admin/attendance/mark', { 
        method: 'POST',
        body: JSON.stringify(body)
      });
      return res.json();
    },
  });
  
  // 4. UI rendering
  return (/* JSX */);
}
```

## Remaining API Routes to Create

### 1. GET /api/admin/attendance/today
**Purpose**: Get today's attendance overview across all batches
**File**: `app/api/admin/attendance/today/route.ts`
**Returns**:
- overallPercentage, presentCount, absentCount, lateCount
- batchSummaries (for each batch with class today)

### 2. POST /api/admin/attendance/qr/generate
**Purpose**: Generate QR code for attendance marking
**File**: `app/api/admin/attendance/qr/generate/route.ts`
**Body**: { batchId, date, sessionId? }
**Returns**: { qrCode (data URL), qrToken, expiresAt }

### 3. POST /api/attendance/qr/scan
**Purpose**: Student/Teacher scans QR code to mark attendance
**File**: `app/api/attendance/qr/scan/route.ts`
**Body**: { qrToken }
**Auth**: Student/Teacher JWT
**Returns**: { success, message, attendance }

### 4. PATCH /api/admin/attendance/[id]/correct
**Purpose**: Correct attendance record with reason
**File**: `app/api/admin/attendance/[id]/correct/route.ts`
**Body**: { newStatus, reason }
**Returns**: Updated attendance record

### 5. GET /api/admin/attendance/alerts
**Purpose**: Get attendance alerts (low attendance students)
**File**: `app/api/admin/attendance/alerts/route.ts`
**Query**: type (critical/warning/all)
**Returns**: Array of alerts with student details

### 6. POST /api/admin/attendance/alerts/[id]/resolve
**Purpose**: Mark alert as resolved
**File**: `app/api/admin/attendance/alerts/[id]/route.ts`
**Body**: { action: 'resolve' }

### 7. POST /api/admin/attendance/alerts/bulk-notify
**Purpose**: Send bulk reminders to parents
**File**: `app/api/admin/attendance/alerts/bulk-notify/route.ts`
**Body**: { studentIds, channels ['whatsapp', 'sms', 'email'] }
**Returns**: { total, sent, failed, results }

### 8. GET /api/admin/attendance/reports/student-wise
**Purpose**: Student-wise attendance report
**File**: `app/api/admin/attendance/reports/student-wise/route.ts`
**Query**: fromDate, toDate, batchId
**Returns**: Array with { studentName, presentCount, percentage, etc }

### 9. GET /api/admin/attendance/reports/batch-wise
**Purpose**: Batch-wise attendance report  
**File**: `app/api/admin/attendance/reports/batch-wise/route.ts`
**Query**: fromDate, toDate
**Returns**: Array with batch names, totals, percentages

### 10. GET /api/admin/attendance/reports/monthly
**Purpose**: Monthly calendar view with attendance
**File**: `app/api/admin/attendance/reports/monthly/route.ts`
**Query**: month, year, batchId
**Returns**: { month, days: { 1: 'P', 2: 'A', ... }, summary }

### 11. GET /api/admin/attendance/reports/export
**Purpose**: Export attendance as Excel
**File**: `app/api/admin/attendance/reports/export/route.ts`
**Query**: reportType, fromDate, toDate
**Returns**: Binary Excel file

### 12. GET /api/admin/attendance/stats
**Purpose**: Dashboard statistics and trends
**File**: `app/api/admin/attendance/stats/route.ts`
**Returns**: { todayOverall, weeklyTrend[], monthlyAverage, batchComparison[] }

### 13. GET /api/teacher/attendance/batches
**Purpose**: Teacher's batches for today
**File**: `app/api/teacher/attendance/batches/route.ts`
**Auth**: Teacher JWT
**Returns**: Array of batches with today's schedule

### 14. POST /api/teacher/attendance/mark
**Purpose**: Teacher marks attendance for their batch
**File**: `app/api/teacher/attendance/mark/route.ts`
**Auth**: Teacher JWT
**Same as** `/api/admin/attendance/mark` but validates teacher owns batch

### 15. GET /api/student/attendance
**Purpose**: Student views own attendance
**File**: `app/api/student/attendance/route.ts`
**Auth**: Student JWT
**Returns**: Own attendance records and percentages per batch

### 16. GET /api/parent/attendance
**Purpose**: Parent views child attendance
**File**: `app/api/parent/attendance/route.ts`
**Auth**: Parent JWT
**Query**: childId
**Returns**: Child's attendance records

## Remaining Components to Create

### Admin Attendance Overview
- AttendanceStatsCards.tsx (6 stat cards)
- TodayBatchStatus.tsx (batch status grid)
- AttendanceTrendChart.tsx (line chart - 7 days)
- BatchComparisonChart.tsx (bar chart)
- RecentAttendanceTable.tsx (last 20 records)

### Mark Attendance
- BatchDateSelector.tsx (dropdown + date picker)
- AttendanceMarkingList.tsx (list of students)
- StudentAttendanceRow.tsx (single student row with status buttons)
- QuickActionBar.tsx (Mark all present/absent buttons)
- QRCodeSection.tsx (QR display + generation)
- AttendanceSummaryBar.tsx (bottom summary bar)
- SubmitConfirmModal.tsx (confirmation before submit)

### Reports
- ReportFilters.tsx (type, date range, batch filters)
- StudentWiseReport.tsx (student report table)
- BatchWiseReport.tsx (batch report table)
- DateWiseReport.tsx (calendar view)
- MonthlyReport.tsx (monthly calendar grid)

### Alerts
- AlertThresholdSettings.tsx (Critical/Warning % input)
- AlertCard.tsx (single alert card)
- BulkReminderModal.tsx (bulk notification UI)

### Teacher/Student/Parent Views
- TeacherAttendancePage.tsx
- MyBatchesToday.tsx (today's batches cards)
- AttendanceHistoryTable.tsx (past markings)
- StudentAttendancePage.tsx
- BatchAttendanceTabs.tsx (tabs per batch)
- AttendanceCalendar.tsx (calendar with color coding)
- ParentAttendancePage.tsx (child attendance view)

### Shared Components
- AttendanceStatusBadge.tsx (PRESENT/ABSENT/LATE badge)
- AttendanceProgressBar.tsx (attendance % progress)
- AttendanceCalendarView.tsx (reusable calendar)

## Page Files Structure

```
app/(dashboard)/
├── admin/attendance/
│   ├── page.tsx              # Overview page
│   ├── mark/page.tsx         # Mark attendance
│   ├── reports/page.tsx      # Reports page
│   └── alerts/page.tsx       # Alerts page
├── teacher/attendance/
│   └── page.tsx              # Teacher marking
├── student/attendance/
│   └── page.tsx              # Student view
└── parent/attendance/
    └── page.tsx              # Parent view
```

## Implementation Priority

### Phase 1 (Core - CRITICAL)
1. ✅ Schema (DONE)
2. ✅ Seed Data (DONE)
3. ✅ Utilities (DONE)
4. ✅ Mark Attendance Route (DONE)
5. ✅ Get Attendance Route (DONE)
6. Today Stats Route
7. Mark Attendance Page
8. Today's Batch Status Component
9. Student Attendance Row Component

### Phase 2 (Dashboard & Reports)
10. Attendance Overview Page
11. Stat Cards Component
12. Charts (Trend + Comparison)
13. Reports Routes
14. Report Components

### Phase 3 (Alerts & Notifications)
15. Alerts Routes
16. Alert Cards & Settings
17. Bulk Notification Modal

### Phase 4 (Teacher/Student/Parent Views)
18. Teacher Attendance Page
19. Student Attendance Page
20. Parent Attendance Page

### Phase 5 (Real-time & Polish)
21. SSE Real-time Route
22. QR Code Integration
23. Dark Mode Polish
24. Mobile Optimization

## Code Generation Commands

To generate a new API route file efficiently:
```bash
# Create directory
mkdir -p app/api/admin/attendance/[specific-route]

# Create route.ts with pattern from this guide
```

To generate a component:
```bash
# Create component file
touch components/admin/attendance/[ComponentName].tsx

# Use pattern from this guide
```

## Testing Checklist

- [ ] Mark attendance for a batch
- [ ] Verify attendance session created
- [ ] Check notifications sent
- [ ] Create low attendance alerts
- [ ] Generate QR code
- [ ] Student scans QR code
- [ ] Correct attendance record
- [ ] Generate reports (all types)
- [ ] Export to Excel
- [ ] Teacher marks own batch
- [ ] Student views attendance
- [ ] Parent views child attendance
- [ ] Bulk reminders sent

## Color Scheme (Tailwind)

- Present: green-600 (#16a34a)
- Absent: red-600 (#dc2626)
- Late: amber-600 (#d97706)
- Leave: blue-600 (#2563eb)
- Holiday: gray-600 (#4b5563)
- Cancelled: purple-600 (#7c3aed)

## Notes

- All routes require JWT authentication
- Role-based access control enforced (SUPER_ADMIN for admin routes)
- Notifications are mocked with console.log (integrate Twilio/WhatsApp API in production)
- QR codes use qrcode package with 30-minute expiry
- All timestamps in UTC
- Database uses cuid() for IDs
- Pagination: default 50 items/page, max 100

