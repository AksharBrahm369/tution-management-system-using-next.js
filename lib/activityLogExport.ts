import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import type { ActivityLogRow } from "@/types/activityLog";

export function buildActivityLogsWorkbook(logs: ActivityLogRow[]): Buffer {
  const rows = logs.map((log) => ({
    Timestamp: log.createdAt,
    Severity: log.severity,
    Category: log.category,
    Action: log.action,
    User: log.userName ?? "System",
    Role: log.userRole ?? "",
    Description: log.description,
    Entity: log.entityName ?? log.entityType ?? "",
    Status: log.isSuccessful ? "Success" : "Failed",
    "IP Address": log.ipAddress ?? "",
    "Error Message": log.errorMessage ?? "",
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Logs");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export async function buildActivityLogsPdf(logs: ActivityLogRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("TuitionPro — Activity Logs", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    logs.forEach((log, index) => {
      if (index > 0) doc.moveDown(0.5);
      doc
        .fontSize(11)
        .fillColor("#111")
        .text(`${log.createdAt} · ${log.severity} · ${log.category}`);
      doc.fontSize(10).fillColor("#333").text(`${log.action} — ${log.description}`);
      doc
        .fontSize(9)
        .fillColor("#666")
        .text(
          `User: ${log.userName ?? "—"} | Entity: ${log.entityName ?? log.entityType ?? "—"} | ${log.isSuccessful ? "Success" : "Failed"}`
        );
      if (log.ipAddress) {
        doc.text(`IP: ${log.ipAddress}`);
      }
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#ddd").stroke();
    });

    doc.end();
  });
}
