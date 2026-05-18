import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import * as xlsx from "xlsx";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const results = await prisma.examResult.findMany({
      where: { examId: id },
      include: { student: true },
      orderBy: { student: { firstName: 'asc' } }
    });

    const data = results.map(r => ({
      "Student Code": r.student.studentCode,
      "Student Name": `${r.student.firstName} ${r.student.lastName}`,
      "Marks": "",
      "Absent (Y/N)": "N",
      "Remarks": ""
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Marks");
    
    // Auto size columns
    const wscols = [
      {wch: 15}, {wch: 25}, {wch: 10}, {wch: 15}, {wch: 30}
    ];
    worksheet['!cols'] = wscols;

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="marks_template.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    });
  } catch (error) {
    return new NextResponse("Failed to generate template", { status: 500 });
  }
}
