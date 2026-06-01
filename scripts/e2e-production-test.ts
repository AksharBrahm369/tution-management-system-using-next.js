/**
 * Production-style E2E API test suite for TuitionPro
 * Run: npx tsx scripts/e2e-production-test.ts
 */
import "dotenv/config";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3001";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "darshanzala369@gmail.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Darshan@369";

const runId = Date.now().toString(36);

type TestResult = {
  name: string;
  ok: boolean;
  status?: number;
  detail?: string;
};

const results: TestResult[] = [];
let cookie = "";

function pass(name: string, detail?: string) {
  results.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name: string, status?: number, detail?: string) {
  results.push({ name, ok: false, status, detail });
  console.log(`  ✗ ${name}${status ? ` [${status}]` : ""}${detail ? ` — ${detail}` : ""}`);
}

async function api(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; body: unknown; headers: Headers }> {
  const headers = new Headers(options.headers);
  if (cookie) headers.set("Cookie", cookie);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, credentials: "include" });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const pair = setCookie.split(";")[0];
    if (pair) cookie = pair;
  }

  let body: unknown;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text.slice(0, 200);
  }

  return { status: res.status, body, headers: res.headers };
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    fail(name, undefined, e instanceof Error ? e.message : String(e));
  }
}

async function main() {
  console.log(`\nTuitionPro E2E — ${BASE_URL}\n`);

  await test("Login as super admin", async () => {
    const { status, body } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, rememberMe: true }),
    });
    const b = body as { success?: boolean; message?: string };
    if (status === 200 && b.success) pass("Login", ADMIN_EMAIL);
    else fail("Login", status, b.message ?? JSON.stringify(body).slice(0, 120));
  });

  if (!cookie) {
    console.error("\nCannot continue without auth cookie.\n");
    process.exit(1);
  }

  await test("GET /admin/dashboard (page)", async () => {
    const res = await fetch(`${BASE_URL}/admin/dashboard`, { headers: { Cookie: cookie } });
    if (res.status === 200) pass("Dashboard page", `${res.status}`);
    else fail("Dashboard page", res.status);
  });

  await test("GET dashboard stats API", async () => {
    const { status, body } = await api("/api/admin/dashboard/stats");
    if (status === 200) pass("Dashboard stats", JSON.stringify(body).slice(0, 80));
    else fail("Dashboard stats", status, JSON.stringify(body).slice(0, 120));
  });

  await test("GET subjects", async () => {
    const { status, body } = await api("/api/admin/subjects");
    const b = body as { subjects?: unknown[] };
    if (status === 200 && Array.isArray(b.subjects) && b.subjects.length > 0) {
      pass("List subjects", `${b.subjects.length} subjects`);
    } else fail("List subjects", status, JSON.stringify(body).slice(0, 120));
  });

  let subjectId = "";
  await test("Resolve subject for teacher/batch", async () => {
    const { body } = await api("/api/admin/subjects");
    const b = body as { subjects?: { id: string; code: string }[] };
    subjectId = b.subjects?.[0]?.id ?? "";
    if (subjectId) pass("Subject ID", subjectId);
    else fail("Subject ID", undefined, "No subjects in DB — run npm run seed");
  });

  let teacherId = "";
  await test("POST create teacher", async () => {
    if (!subjectId) return;
    const payload = {
      firstName: "Test",
      lastName: `Teacher${runId}`,
      email: `teacher.${runId}@tuitionpro.test`,
      phone: `98765${String(runId).slice(-5).padStart(5, "0").slice(0, 5)}`,
      gender: "MALE",
      employmentType: "FULL_TIME",
      salaryType: "FIXED",
      fixedSalary: 25000,
      subjectIds: [subjectId],
    };
    const { status, body } = await api("/api/admin/teachers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const b = body as { id?: string; error?: string };
    if (status === 201 && b.id) {
      teacherId = b.id;
      pass("Create teacher", `${b.id}`);
    } else fail("Create teacher", status, b.error ?? JSON.stringify(body).slice(0, 150));
  });

  await test("GET teachers list", async () => {
    const { status, body } = await api("/api/admin/teachers?limit=5");
    const b = body as { teachers?: unknown[] };
    if (status === 200) pass("List teachers", `${b.teachers?.length ?? 0} returned`);
    else fail("List teachers", status);
  });

  let studentId = "";
  await test("POST create student", async () => {
    const phone = `98${String(10000000 + (Date.now() % 90000000)).slice(0, 8)}`.slice(0, 10);
    const payload = {
      firstName: "Test",
      lastName: `Student${runId}`,
      email: `student.${runId}@tuitionpro.test`,
      phone,
      gender: "MALE",
      academicYear: "2025-26",
      city: "Ahmedabad",
      state: "Gujarat",
      primaryContact: "FATHER",
      fatherPhone: phone,
      joiningDate: new Date().toISOString(),
      category: "GOOD",
      status: "ACTIVE",
      emergencyContacts: [{ name: "Parent Test", relationship: "Father", phone }],
      batchIds: [],
    };
    const { status, body } = await api("/api/admin/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const b = body as { student?: { id: string; studentCode?: string }; error?: string };
    if (status === 201 && b.student?.id) {
      studentId = b.student.id;
      pass("Create student", `${b.student.studentCode ?? b.student.id}`);
    } else fail("Create student", status, b.error ?? JSON.stringify(body).slice(0, 200));
  });

  await test("GET students list", async () => {
    const { status, body } = await api("/api/admin/students?limit=5");
    const b = body as { students?: unknown[] };
    if (status === 200) pass("List students", `${b.students?.length ?? 0} returned`);
    else fail("List students", status);
  });

  let batchId = "";
  await test("POST create batch", async () => {
    if (!subjectId || !teacherId) {
      fail("Create batch", undefined, "Missing subject or teacher");
      return;
    }
    const code = `BCH-E2E-${runId.toUpperCase()}`;
    const payload = {
      name: `E2E Batch ${runId}`,
      code,
      subjectId,
      teacherId,
      academicYear: "2025-26",
      days: ["MONDAY", "WEDNESDAY"],
      startTime: "16:00",
      endTime: "17:30",
      maxStrength: 30,
      fees: 5000,
      startDate: new Date().toISOString(),
      studentIds: studentId ? [studentId] : [],
      generateSessions: true,
    };
    const { status, body } = await api("/api/admin/batches", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const b = body as { batch?: { id: string }; error?: string };
    if ((status === 201 || status === 200) && b.batch?.id) {
      batchId = b.batch.id;
      pass("Create batch", b.batch.id);
    } else fail("Create batch", status, b.error ?? JSON.stringify(body).slice(0, 200));
  });

  if (studentId && batchId) {
    await test("POST enroll student in batch", async () => {
      const { status, body } = await api(`/api/admin/batches/${batchId}/students`, {
        method: "POST",
        body: JSON.stringify({ studentIds: [studentId] }),
      });
      const b = body as { enrolled?: number; error?: string };
      if (status === 200) pass("Enroll student", `count=${b.enrolled ?? "ok"}`);
      else fail("Enroll student", status, b.error ?? JSON.stringify(body).slice(0, 100));
    });
  }

  await test("GET batches list", async () => {
    const { status } = await api("/api/admin/batches?limit=5");
    if (status === 200) pass("List batches");
    else fail("List batches", status);
  });

  await test("GET fees dashboard", async () => {
    const { status } = await api("/api/admin/fees");
    if (status === 200) pass("Fees module");
    else fail("Fees module", status);
  });

  await test("GET attendance today", async () => {
    const { status } = await api("/api/admin/attendance/today");
    if (status === 200) pass("Attendance today");
    else fail("Attendance today", status);
  });

  await test("GET exams list", async () => {
    const { status } = await api("/api/admin/exams?limit=5");
    if (status === 200) pass("Exams list");
    else fail("Exams list", status);
  });

  await test("GET enquiries", async () => {
    const { status } = await api("/api/admin/enquiries?limit=5");
    if (status === 200) pass("Enquiries list");
    else fail("Enquiries list", status);
  });

  await test("GET activity logs", async () => {
    const { status, body } = await api("/api/admin/logs?limit=5");
    const b = body as { logs?: unknown[]; stats?: unknown };
    if (status === 200 && b.logs) pass("Activity logs", `${b.logs.length} logs`);
    else fail("Activity logs", status);
  });

  await test("GET settings", async () => {
    const { status } = await api("/api/admin/settings");
    if (status === 200) pass("Settings");
    else fail("Settings", status);
  });

  await test("GET notifications", async () => {
    const { status } = await api("/api/admin/notifications");
    if (status === 200) pass("Notifications");
    else fail("Notifications", status);
  });

  await test("GET parents", async () => {
    const { status } = await api("/api/admin/parents?limit=5");
    if (status === 200) pass("Parents list");
    else fail("Parents list", status);
  });

  // ── Extended module smoke tests ─────────────────────────────────────────
  const moduleGets: Array<[string, string]> = [
    ["Dashboard charts", "/api/admin/dashboard/charts"],
    ["Dashboard alerts", "/api/admin/dashboard/alerts"],
    ["Today's classes", "/api/admin/dashboard/todays-classes"],
    ["Recent students", "/api/admin/dashboard/recent-students"],
    ["Recent payments", "/api/admin/dashboard/recent-payments"],
    ["Attendance stats", "/api/admin/attendance/stats"],
    ["Attendance list", "/api/admin/attendance?limit=5"],
    ["Fee records", "/api/admin/fees/records?limit=5"],
    ["Fee defaulters", "/api/admin/fees/defaulters"],
    ["Fee reports", "/api/admin/fees/reports"],
    ["Rooms", "/api/admin/rooms"],
    ["Holidays", "/api/admin/holidays"],
    ["Schedule", "/api/admin/schedule"],
    ["Calendar", "/api/admin/calendar"],
    ["Grade configs", "/api/admin/grade-configs"],
    ["Enquiry analytics", "/api/admin/enquiries/analytics"],
    ["Exam analytics", "/api/admin/exams/analytics"],
    ["Exam results", "/api/admin/exams/results"],
    ["Announcements", "/api/admin/announcements"],
    ["Parents PTM", "/api/admin/parents/ptm"],
    ["Parents feedback", "/api/admin/parents/feedback"],
    ["Logs security", "/api/admin/logs/security"],
    ["Academic years", "/api/admin/settings/academic-years"],
    ["Backup history", "/api/admin/settings/backup/history"],
  ];

  for (const [name, path] of moduleGets) {
    await test(`GET ${name}`, async () => {
      const { status } = await api(path);
      if (status >= 200 && status < 300) pass(name, String(status));
      else fail(name, status);
    });
  }

  if (studentId) {
    await test("GET student detail", async () => {
      const { status } = await api(`/api/admin/students/${studentId}`);
      if (status === 200) pass("Student detail");
      else fail("Student detail", status);
    });

    await test("PATCH student status", async () => {
      const { status, body } = await api(`/api/admin/students/${studentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "ACTIVE",
          reason: "E2E verification — status OK",
        }),
      });
      if (status === 200) pass("Student status update");
      else fail("Student status update", status, JSON.stringify(body).slice(0, 100));
    });

    await test("GET student timeline", async () => {
      const { status } = await api(`/api/admin/students/${studentId}/timeline`);
      if (status === 200) pass("Student timeline");
      else fail("Student timeline", status);
    });
  }

  if (teacherId) {
    await test("GET teacher detail", async () => {
      const { status } = await api(`/api/admin/teachers/${teacherId}`);
      if (status === 200) pass("Teacher detail");
      else fail("Teacher detail", status);
    });
  }

  if (batchId) {
    await test("GET batch detail", async () => {
      const { status } = await api(`/api/admin/batches/${batchId}`);
      if (status === 200) pass("Batch detail");
      else fail("Batch detail", status);
    });

    if (studentId) {
      await test("POST mark attendance", async () => {
        const date = new Date();
        date.setHours(12, 0, 0, 0);
        const { status, body } = await api("/api/admin/attendance/mark", {
          method: "POST",
          body: JSON.stringify({
            batchId,
            date: date.toISOString(),
            notifyParents: false,
            attendance: [{ studentId, status: "PRESENT" }],
          }),
        });
        const b = body as { success?: boolean; error?: string };
        if (status === 200 && b.success) pass("Mark attendance");
        else if (status === 400 && String(JSON.stringify(body)).includes("Holiday"))
          pass("Mark attendance", "skipped (holiday)");
        else fail("Mark attendance", status, b.error ?? JSON.stringify(body).slice(0, 120));
      });

      await test("POST generate QR", async () => {
        const { status, body } = await api("/api/admin/attendance/qr/generate", {
          method: "POST",
          body: JSON.stringify({ batchId, date: new Date().toISOString() }),
        });
        const b = body as { success?: boolean };
        if (status === 200 && b.success) pass("QR generate");
        else fail("QR generate", status, JSON.stringify(body).slice(0, 100));
      });
    }
  }

  await test("GET global search", async () => {
    const { status, body } = await api("/api/admin/search?q=Test");
    const b = body as { results?: unknown[] };
    if (status === 200 && Array.isArray(b.results)) pass("Search", `${b.results.length} hits`);
    else fail("Search", status);
  });

  await test("GET admin UI routes (smoke)", async () => {
    const pages = [
      "/admin/students",
      "/admin/teachers",
      "/admin/batches",
      "/admin/fees",
      "/admin/attendance",
      "/admin/exams",
      "/admin/enquiries",
      "/admin/settings",
      "/admin/logs",
      "/admin/communication",
    ];
    let ok = 0;
    for (const p of pages) {
      const res = await fetch(`${BASE_URL}${p}`, { headers: { Cookie: cookie } });
      if (res.status === 200) ok++;
    }
    if (ok === pages.length) pass("Admin pages render", `${ok}/${pages.length}`);
    else fail("Admin pages render", undefined, `${ok}/${pages.length} returned 200`);
  });

  await test("POST logout", async () => {
    const { status, body } = await api("/api/auth/logout", { method: "POST" });
    const b = body as { success?: boolean };
    if (status === 200 && b.success) pass("Logout");
    else fail("Logout", status);
  });

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed}/${results.length} passed`);
  if (failed.length) {
    console.log("\nFailed tests:");
    failed.forEach((f) => console.log(`  • ${f.name}: ${f.detail ?? f.status}`));
    process.exit(1);
  }
  console.log("\nAll production E2E checks passed.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
