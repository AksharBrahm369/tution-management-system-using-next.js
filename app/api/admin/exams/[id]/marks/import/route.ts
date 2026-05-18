import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || !["SUPER_ADMIN", "TEACHER"].includes(user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);

    const { id } = await params;
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: { student: true }
    });

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    const updates = [];

    for (const row of data) {
      const studentCode = row["Student Code"];
      const marksStr = row["Marks"];
      const isAbsent = row["Absent (Y/N)"]?.toUpperCase() === "Y";
      const remarks = row["Remarks"] || "";

      if (!studentCode) continue;

      const result = results.find(r => r.student.studentCode === studentCode);
      if (!result) {
        failed++;
        errors.push(`Student ${studentCode} not found in this exam`);
        continue;
      }

      let marks = null;
      if (!isAbsent && marksStr !== undefined && marksStr !== "") {
        marks = parseFloat(marksStr);
        if (isNaN(marks) || marks < 0 || marks > exam.totalMarks) {
          failed++;
          errors.push(`Invalid marks for ${studentCode}`);
          continue;
        }
      }

      updates.push({
        studentId: result.studentId,
        marksObtained: marks,
        isAbsent,
        teacherRemarks: remarks
      });
      imported++;
    }

    // Now call the batch update function logic here or pass back to client to submit via normal route
    // The prompt says "Import marks: Parse and validate, Import marks, Return { imported, failed, errors }"
    // So we'll just return the parsed validated data to frontend, or update directly.
    // Given the prompt: "Return { imported, failed, errors }", we should probably update directly.

    // Using existing marksEntrySchema logic for consistency
    const res = await fetch(new URL(`/api/admin/exams/${id}/marks`, req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": req.headers.get("cookie") || "" },
      body: JSON.stringify({ results: updates, calculateRanks: false, publishNow: false, notifyParents: false })
    });

    if (!res.ok) throw new Error("Failed to save imported marks");

    return NextResponse.json({ imported, failed, errors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to import excel" }, { status: 500 });
  }
}
