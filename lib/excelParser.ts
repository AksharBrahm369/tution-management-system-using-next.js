import * as XLSX from "xlsx";
import { z } from "zod";

export const studentImportRowSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().min(1),
  academicYear: z.string().min(1),
  fatherName: z.string().optional().or(z.literal("")),
  fatherPhone: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
});

export type StudentImportRow = z.infer<typeof studentImportRowSchema>;

export interface ParsedStudentImport {
  rows: StudentImportRow[];
  errors: Array<{ row: number; errors: string[] }>;
}

function normalizeRow(row: Record<string, unknown>): StudentImportRow {
  const get = (key: string): string => {
    const value = row[key];
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  };

  return {
    firstName: get("First Name") || get("firstName"),
    lastName: get("Last Name") || get("lastName"),
    email: get("Email") || get("email"),
    phone: get("Phone") || get("phone"),
    dateOfBirth: get("Date of Birth") || get("dateOfBirth"),
    gender: get("Gender") || get("gender"),
    academicYear: get("Academic Year") || get("academicYear"),
    fatherName: get("Father Name") || get("fatherName"),
    fatherPhone: get("Father Phone") || get("fatherPhone"),
    city: get("City") || get("city"),
    state: get("State") || get("state"),
  };
}

export function parseStudentExcel(buffer: ArrayBuffer): ParsedStudentImport {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: [{ row: 0, errors: ["No worksheet found"] }] };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

  const rows: StudentImportRow[] = [];
  const errors: ParsedStudentImport["errors"] = [];

  rawRows.forEach((rawRow, index) => {
    const normalized = normalizeRow(rawRow);
    const validation = studentImportRowSchema.safeParse(normalized);
    if (!validation.success) {
      errors.push({
        row: index + 2,
        errors: validation.error.issues.map((issue) => issue.message),
      });
      return;
    }

    rows.push(validation.data);
  });

  return { rows, errors };
}

export function buildStudentTemplate(): Record<string, string>[] {
  return [
    {
      "First Name": "Aarav",
      "Last Name": "Shah",
      Email: "aarav@example.com",
      Phone: "9876543210",
      "Date of Birth": "2010-04-01",
      Gender: "MALE",
      "Academic Year": "2025-26",
      "Father Name": "Rajesh Shah",
      "Father Phone": "9876543211",
      City: "Mumbai",
      State: "Maharashtra",
    },
  ];
}
