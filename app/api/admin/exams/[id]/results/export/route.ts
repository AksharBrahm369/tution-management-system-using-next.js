import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as xlsx from "xlsx";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user || user.role !== "SUPER_ADMIN") return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true } },
        exam: { select: { title: true, totalMarks: true } }
      },
      orderBy: { batchRank: 'asc' }
    });

    if (results.length === 0) return new NextResponse("No results found", { status: 404 });

    const data = results.map(r => ({
      "Rank": r.batchRank || "-",
      "Student Code": r.student.studentCode,
      "Name": `${r.student.firstName} ${r.student.lastName}`,
      "Marks Obtained": r.isAbsent ? "AB" : r.marksObtained,
      "Total Marks": r.totalMarks,
      "Percentage": r.percentage ? `${r.percentage}%` : "-",
      "Grade": r.grade || "-",
      "Status": r.status,
      "Remarks": r.teacherRemarks || ""
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Results");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="exam_results_${id}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    });
  } catch (error) {
    return new NextResponse("Failed to export", { status: 500 });
  }
}
