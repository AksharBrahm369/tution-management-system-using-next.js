import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/adminAuth";
import { parseStudentExcel } from "@/lib/excelParser";
import { generateNextStudentCode } from "@/lib/studentCode";
import { Gender, StudentCategory, StudentStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel file is required" }, { status: 400 });
    }

    const parsed = parseStudentExcel(await file.arrayBuffer());
    const imported: string[] = [];
    const failed: Array<{ row: number; reason: string }> = [];

    for (const [index, row] of parsed.rows.entries()) {
      try {
        const parent = await prisma.parent.create({
          data: {
            fatherName: row.fatherName || null,
            fatherPhone: row.fatherPhone || null,
            primaryContact: "FATHER",
          },
        });

        const student = await prisma.student.create({
          data: {
            studentCode: await generateNextStudentCode(),
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email || null,
            phone: row.phone || null,
            dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
            gender: row.gender.toUpperCase() as Gender,
            city: row.city || null,
            state: row.state || null,
            academicYear: row.academicYear,
            status: StudentStatus.ACTIVE,
            category: StudentCategory.AVERAGE,
            parentId: parent.id,
            emergencyContacts: {
              create: row.fatherName
                ? [
                    {
                      name: row.fatherName,
                      relationship: "Father",
                      phone: row.fatherPhone || "9999999999",
                    },
                  ]
                : [],
            },
            activities: {
              create: {
                type: "IMPORTED",
                title: "Student imported",
                description: `${row.firstName} ${row.lastName} imported via Excel.`,
              },
            },
          },
        });

        imported.push(student.id);
      } catch (error) {
        failed.push({ row: index + 2, reason: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json(
      {
        imported: imported.length,
        failed: failed.length,
        errors: [...parsed.errors, ...failed],
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
