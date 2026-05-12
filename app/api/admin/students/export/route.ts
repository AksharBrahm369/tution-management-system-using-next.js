import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);

    const students = await prisma.student.findMany({
      include: { parent: true, batchEnrollments: { include: { batch: true } } },
      orderBy: { createdAt: "desc" },
    });

    const rows = students.map((student) => ({
      "Student Code": student.studentCode,
      "First Name": student.firstName,
      "Last Name": student.lastName,
      Email: student.email ?? "",
      Phone: student.phone ?? "",
      Gender: student.gender,
      "Academic Year": student.academicYear,
      Status: student.status,
      Category: student.category,
      City: student.city ?? "",
      State: student.state ?? "",
      "Father Name": student.parent?.fatherName ?? "",
      "Father Phone": student.parent?.fatherPhone ?? "",
      Batch: student.batchEnrollments.find((enrollment) => enrollment.isActive)?.batch?.name ?? "",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="tuitionpro-students.xlsx"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
