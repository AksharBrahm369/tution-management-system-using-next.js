# Attendance Module - Complete Testing Guide

## Setup & Prerequisites

### 1. Environment Check
```bash
# Verify all dependencies installed
npm list @prisma/client qrcode xlsx recharts date-fns

# Verify database connection
npx prisma db execute --stdin < "SELECT 1;"

# Regenerate Prisma client if needed
npx prisma generate
```

### 2. Database Preparation
```bash
# Reset database and seed with attendance data
npm run seed

# Verify tables created
npx prisma studio  # Opens GUI to inspect database
```

### 3. Start Development Server
```bash
npm run dev
# Should see: ▲ Next.js 16.2.6
# Ready in 2.3s
```

---

## Manual Testing Checklist

### PHASE 1: Authentication & Access Control

- [ ] **Admin Access**: Login as SUPER_ADMIN
  - Navigate to `/admin/attendance`
  - Should see full overview page with all components
  - Should see "Mark Attendance" button

- [ ] **Teacher Access**: Login as TEACHER
  - Navigate to `/teacher/attendance`
  - Should only see their own batches
  - Should NOT have access to `/admin/attendance`
  - Should get 403 error if trying to access admin routes

- [ ] **Student Access**: Login as STUDENT
  - Navigate to `/student/attendance`
  - Should see own attendance records only
  - Should NOT see other students' records
  - Should see warning if attendance < 75%

- [ ] **Parent Access**: Login as PARENT
  - Navigate to `/parent/attendance`
  - Should see child's attendance
  - Should see notification history

---

### PHASE 2: Mark Attendance

#### Test Case 1: Basic Attendance Marking

1. Login as SUPER_ADMIN
2. Go to `/admin/attendance/mark`
3. **Select Batch & Date**:
   - [ ] Batch dropdown shows all active batches
   - [ ] Date picker defaults to today
   - [ ] Can select past dates (not future)
   - [ ] Batch info card appears on selection

4. **Mark Students**:
   - [ ] All students listed
   - [ ] Can mark Present, Absent, Late, Leave for each
   - [ ] Row background changes based on status
   - [ ] Can toggle status (click same button = deselect)
   - [ ] Progress bar updates in real-time

5. **Quick Actions**:
   - [ ] "Mark All Present" marks all students
   - [ ] "Mark All Absent" marks all students
   - [ ] "Reset All" clears all selections
   - [ ] Count updates correctly

6. **Late Marking**:
   - [ ] Late status shows time input
   - [ ] Can enter arrival time (HH:MM)
   - [ ] Late minutes calculated automatically

7. **Leave Marking**:
   - [ ] Leave status shows reason field
   - [ ] Can enter leave reason
   - [ ] Reason saved with record

8. **Submit**:
   - [ ] Confirmation modal shows summary
   - [ ] Summary accurate (counts correct)
   - [ ] Can review and confirm
   - [ ] Success message appears after submit
   - [ ] Attendance records created in database

#### Test Case 2: Attendance Already Marked

1. Mark attendance for a batch
2. Try marking same batch again
3. [ ] Yellow banner: "Attendance already marked"
4. [ ] Can edit existing records
5. [ ] Changes saved correctly

---

### PHASE 3: Overview & Analytics

#### Test Case 3: Attendance Overview Page

1. Go to `/admin/attendance`
2. **Stat Cards**:
   - [ ] Today's Overall Attendance %
   - [ ] Present Today count
   - [ ] Absent Today count
   - [ ] Late Today count
   - [ ] Low Attendance Alerts count
   - [ ] Monthly Average %
   - [ ] Color coding correct (Green > 80%, Yellow 60-80%, Red < 60%)

3. **Today's Batch Status**:
   - [ ] Shows all batches with class today
   - [ ] Batch name, time, teacher shown
   - [ ] Marked status badge (✓ or ⚠️)
   - [ ] Attendance count bar
   - [ ] Status breakdown (Present, Absent, Late, Leave)
   - [ ] Action buttons ("Mark Now" or "Edit")

4. **Charts**:
   - [ ] 7-day trend line chart shows correctly
   - [ ] Batch comparison bar chart shows correctly
   - [ ] Colors match status thresholds

5. **Recent Activity Table**:
   - [ ] Last 20 attendance records listed
   - [ ] Student name, batch, date shown
   - [ ] Status badges color-coded
   - [ ] Parent notified indicator shown

---

### PHASE 4: QR Code Attendance

#### Test Case 4: QR Code Generation

1. Go to `/admin/attendance/mark`
2. Mark attendance for a batch
3. **Generate QR Code**:
   - [ ] "Enable QR Code" section visible
   - [ ] Click "Generate QR Code" button
   - [ ] QR code displays
   - [ ] Timer shows 30 minute countdown
   - [ ] QR token stored in database

#### Test Case 5: QR Code Scanning

1. Generate QR code (from Test 4)
2. Open QR code URL on student's phone or browser
3. **Student Scan**:
   - [ ] URL opens showing batch name and date
   - [ ] Shows "Mark as Present" confirmation
   - [ ] Student marked as present in real-time
   - [ ] Teacher's marking page updates without refresh
   - [ ] "You are marked present!" message shows

#### Test Case 6: QR Expiry

1. Generate QR code
2. Wait 30 minutes (or set expiry to past)
3. Try scanning expired QR
4. [ ] "QR code has expired" message
5. [ ] Cannot mark attendance
6. [ ] Should regenerate new QR

---

### PHASE 5: Attendance Reports

#### Test Case 7: Student Wise Report

1. Go to `/admin/attendance/reports`
2. **Report Type**: Select "Student Wise Report"
3. **Filters**:
   - [ ] Can filter by batch
   - [ ] Can filter by date range
   - [ ] Can filter by attendance status

4. **Report Display**:
   - [ ] Student name, code, batch shown
   - [ ] Total classes, Present, Absent, Late shown
   - [ ] Attendance % calculated correctly
   - [ ] Status indicator (Good/Warning/Critical)

5. **Export**:
   - [ ] Click "Export Excel"
   - [ ] Excel file downloads
   - [ ] Excel contains correct data
   - [ ] Formatting is clean

#### Test Case 8: Monthly Report

1. Go to `/admin/attendance/reports`
2. **Report Type**: Select "Monthly Report"
3. **Month Selection**:
   - [ ] Month picker works
   - [ ] Can select current or past months
   - [ ] Cannot select future months

4. **Monthly View**:
   - [ ] Calendar grid shows
   - [ ] Each day shows: P (Present), A (Absent), L (Late), H (Holiday), O (Leave)
   - [ ] Color coding matches status
   - [ ] Summary stats at top (working days, average %, best/worst days)

5. **Per-Student Calendar**:
   - [ ] Each student row shows attendance per day
   - [ ] Total and monthly % correct
   - [ ] Can download as PDF per student

---

### PHASE 6: Alerts & Notifications

#### Test Case 9: Low Attendance Alerts

1. Go to `/admin/attendance/alerts`
2. **Alert Thresholds**:
   - [ ] Can set Critical threshold (e.g., 60%)
   - [ ] Can set Warning threshold (e.g., 75%)
   - [ ] Settings save correctly

3. **Alert Tabs**:
   - [ ] "Critical" tab shows students < 60%
   - [ ] "Warning" tab shows students 60-75%
   - [ ] "All Alerts" tab shows all

4. **Alert Cards**:
   - [ ] Student name, code, batch shown
   - [ ] Current attendance % shown
   - [ ] Parent contact info visible
   - [ ] Action buttons: "Call Parent", "Send WhatsApp"

#### Test Case 10: Bulk Reminders

1. Go to `/admin/attendance/alerts`
2. Click "Send Bulk Reminder"
3. **Modal**:
   - [ ] Shows count of students below 75%
   - [ ] Shows message template
   - [ ] Can toggle channels (WhatsApp, SMS, Email)
   - [ ] Can preview message

4. **Send Reminders**:
   - [ ] Click "Send to All"
   - [ ] Progress bar shows sending
   - [ ] Console shows mock notifications
   - [ ] Notification records created in database

#### Test Case 11: Attendance Notifications

1. Mark a student ABSENT
2. Check with "Notify Parents" enabled
3. **Notification Created**:
   - [ ] AttendanceNotification record exists
   - [ ] Status is ABSENT
   - [ ] isSent = true
   - [ ] Message template generated correctly
   - [ ] Parent details populated

---

### PHASE 7: Teacher Views

#### Test Case 12: Teacher Mark Attendance

1. Login as TEACHER
2. Go to `/teacher/attendance`
3. **My Batches Today**:
   - [ ] Only teacher's batches shown
   - [ ] Batches scheduled for today shown first
   - [ ] Batch info and status shown

4. **Mark Attendance**:
   - [ ] Same UI as admin marking
   - [ ] Same functionality
   - [ ] Limited to their batches only
   - [ ] Cannot mark other batches (403 if attempted)

#### Test Case 13: Teacher Attendance History

1. Logged in as TEACHER
2. On `/teacher/attendance` page
3. **History Table**:
   - [ ] Shows past markings by teacher
   - [ ] Date, batch, count, percentage shown
   - [ ] Can view past marking details

---

### PHASE 8: Student & Parent Views

#### Test Case 14: Student Attendance View

1. Login as STUDENT
2. Go to `/student/attendance`
3. **Summary Cards**:
   - [ ] Overall attendance %
   - [ ] Total classes count
   - [ ] Present count
   - [ ] Absent count
   - [ ] Late count

4. **Batch Tabs**:
   - [ ] One tab per enrolled batch
   - [ ] Each tab shows batch-specific attendance
   - [ ] Calendar with color coding

5. **Low Attendance Warning**:
   - [ ] If attendance < 75%, warning banner shown
   - [ ] Message: "Below 75%, please attend regularly"

#### Test Case 15: Parent Attendance View

1. Login as PARENT
2. Go to `/parent/attendance`
3. **Child Selection** (if multiple children):
   - [ ] Can switch between children
   - [ ] View updates on selection

4. **Attendance Display**:
   - [ ] Same as student view
   - [ ] Shows child's name
   - [ ] Read-only (no edit buttons)

5. **Notification History**:
   - [ ] Previous notifications shown
   - [ ] Date, child name, status, notification date shown

---

### PHASE 9: Corrections & Edits

#### Test Case 16: Correct Attendance

1. Go to an existing attendance record
2. **Edit Attendance**:
   - [ ] Change status (e.g., ABSENT → PRESENT)
   - [ ] Enter correction reason (required)
   - [ ] isCorrected flag = true
   - [ ] correctionReason saved
   - [ ] correctedBy = current user
   - [ ] correctedAt = current time
   - [ ] originalStatus saved

3. **Correction Log**:
   - [ ] Correction visible in history
   - [ ] Shows who corrected and when

---

### PHASE 10: Edge Cases & Error Handling

#### Test Case 17: Holiday Attendance

1. Try marking attendance on a holiday date
2. [ ] Red banner: "This date is marked as holiday"
3. [ ] Cannot mark attendance
4. [ ] Status set to HOLIDAY instead

#### Test Case 18: No Students Enrolled

1. Create batch with 0 students
2. Try marking attendance
3. [ ] Shows "No students enrolled"
4. [ ] Cannot submit

#### Test Case 19: Future Date Attempt

1. Try selecting future date in date picker
2. [ ] Future dates disabled/grayed out
3. [ ] Cannot select future dates

#### Test Case 20: Database Validation

1. Try marking same student twice for same batch on same date
2. [ ] Only one record exists (upsert behavior)
3. [ ] Latest update overwrites

---

## API Testing (Using Postman or curl)

### Test Case 21: Mark Attendance API

```bash
# POST /api/admin/attendance/mark
curl -X POST http://localhost:3000/api/admin/attendance/mark \
  -H "Content-Type: application/json" \
  -H "Cookie: tuitionpro_auth=YOUR_JWT_TOKEN" \
  -d '{
    "batchId": "batch123",
    "date": "2025-01-15",
    "attendance": [
      {
        "studentId": "stu1",
        "status": "PRESENT"
      },
      {
        "studentId": "stu2",
        "status": "ABSENT"
      }
    ],
    "notifyParents": true
  }'

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "sessionId": "...",
#     "attendanceRecordsCount": 2,
#     "summary": { ... }
#   }
# }
```

### Test Case 22: Get Attendance API

```bash
# GET /api/admin/attendance
curl http://localhost:3000/api/admin/attendance?batchId=batch123&limit=10 \
  -H "Cookie: tuitionpro_auth=YOUR_JWT_TOKEN"

# Expected: Paginated attendance records with summary
```

### Test Case 23: Today Stats API

```bash
# GET /api/admin/attendance/today
curl http://localhost:3000/api/admin/attendance/today \
  -H "Cookie: tuitionpro_auth=YOUR_JWT_TOKEN"

# Expected: Today's overview, batch summaries, statistics
```

### Test Case 24: Generate QR API

```bash
# POST /api/admin/attendance/qr/generate
curl -X POST http://localhost:3000/api/admin/attendance/qr/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: tuitionpro_auth=YOUR_JWT_TOKEN" \
  -d '{
    "batchId": "batch123",
    "date": "2025-01-15"
  }'

# Expected: QR code data URL, token, expiry time
```

---

## Performance & Load Testing

### Test Case 25: Large Attendance Marking

1. Create batch with 100+ students
2. Mark attendance for all
3. [ ] UI responsive
4. [ ] Page doesn't freeze
5. [ ] Submit completes within 5 seconds

### Test Case 26: Report Generation (Large Dataset)

1. Generate report for 6 months of data
2. [ ] Report loads within 3 seconds
3. [ ] Export completes within 10 seconds
4. [ ] No memory issues

---

## Dark Mode Testing

- [ ] All stat cards render correctly in dark mode
- [ ] Charts visible and readable
- [ ] Text contrast meets WCAG AA standards
- [ ] Backgrounds appropriately darkened

---

## Mobile/Responsive Testing

- [ ] Mark attendance page works on mobile
- [ ] Stat cards stack vertically on small screens
- [ ] Tables scroll horizontally if needed
- [ ] Buttons appropriately sized for touch
- [ ] QR code visible on mobile

---

## Database Verification

After completing tests, verify database state:

```sql
-- Check attendance records
SELECT COUNT(*) FROM attendance;

-- Check sessions created
SELECT COUNT(*) FROM attendance_sessions;

-- Check alerts
SELECT COUNT(*) FROM attendance_alerts WHERE is_resolved = false;

-- Check notifications
SELECT COUNT(*) FROM attendance_notifications WHERE is_sent = true;
```

---

## Final Checklist

- [ ] All 26 test cases pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Database integrity maintained
- [ ] All roles access control working
- [ ] Notifications appear in console (mock)
- [ ] Charts render correctly
- [ ] Reports export as valid Excel
- [ ] QR codes generate and scan
- [ ] Dark mode fully functional
- [ ] Responsive on all screen sizes

---

## Known Limitations & Future Enhancements

1. **Notifications**: Currently mocked with console.log
   - TODO: Integrate Twilio WhatsApp API
   - TODO: Integrate SMS gateway
   - TODO: Email integration

2. **QR Scanning**: Requires manual QR decode
   - TODO: Implement web-based QR scanner
   - TODO: Mobile app with camera

3. **Real-time**: Uses polling (2-second interval)
   - TODO: Switch to WebSocket for true real-time
   - TODO: Implement push notifications

4. **Bulk Operations**: Currently sequential
   - TODO: Batch process for better performance

