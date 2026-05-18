import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import prisma from './prisma';

export async function generateReportCard(studentId: string, batchId: string, academicYear: string, term: string, generatedBy: string) {
  // 1. Fetch student details
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parent: true,
      batchEnrollments: {
        where: { batchId },
        include: { batch: { include: { subject: true } } }
      }
    }
  });

  if (!student) throw new Error("Student not found");

  const batchInfo = student.batchEnrollments[0]?.batch;

  // 2. Fetch all exam results
  const results = await prisma.examResult.findMany({
    where: {
      studentId,
      batchId,
      exam: { academicYear, isResultPublished: true }
    },
    include: { exam: true },
    orderBy: { exam: { examDate: 'asc' } }
  });

  // 3. Fetch attendance summary
  const totalClasses = await prisma.attendanceSession.count({ where: { batchId } });
  const presentCount = await prisma.attendance.count({
    where: { studentId, batchId, status: { in: ["PRESENT", "LATE"] } }
  });
  const attendancePercent = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : "0";

  // 4. Generate PDF
  return new Promise<string>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const tmpPath = path.join(process.cwd(), `tmp`, `report-${studentId}-${Date.now()}.pdf`);
    
    // Ensure tmp exists
    if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) {
      fs.mkdirSync(path.join(process.cwd(), 'tmp'), { recursive: true });
    }

    const stream = fs.createWriteStream(tmpPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('TuitionPro Institute', { align: 'center' });
    doc.fontSize(12).text('123 Education Street, Knowledge City', { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text('ACADEMIC REPORT CARD', { align: 'center', underline: true });
    doc.fontSize(12).text(`Academic Year: ${academicYear} | Term: ${term}`, { align: 'center' });
    doc.moveDown(2);

    // Student Info
    doc.fontSize(12);
    doc.text(`Name: ${student.firstName} ${student.lastName}`);
    doc.text(`Code: ${student.studentCode}`);
    doc.text(`Batch: ${batchInfo?.name || 'N/A'}`);
    doc.text(`Father's Name: ${student.parent?.fatherName || 'N/A'}`);
    doc.moveDown(2);

    // Performance Table
    doc.fontSize(14).text('Performance Details', { underline: true });
    doc.moveDown();

    doc.fontSize(10);
    const tableTop = doc.y;
    let y = tableTop;

    // Headers
    doc.text('Exam', 50, y);
    doc.text('Date', 200, y);
    doc.text('Max', 300, y);
    doc.text('Obtained', 350, y);
    doc.text('%', 420, y);
    doc.text('Grade', 470, y);
    y += 20;

    // Line
    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;

    let totalMax = 0;
    let totalObtained = 0;

    results.forEach(res => {
      doc.text(res.exam.title, 50, y, { width: 140, ellipsis: true });
      doc.text(new Date(res.exam.examDate).toLocaleDateString(), 200, y);
      doc.text(res.exam.totalMarks.toString(), 300, y);
      doc.text(res.isAbsent ? 'AB' : (res.marksObtained?.toString() || 'N/A'), 350, y);
      doc.text(res.percentage ? `${res.percentage}%` : '-', 420, y);
      doc.text(res.grade || '-', 470, y);
      
      if (!res.isAbsent) {
        totalMax += res.exam.totalMarks;
        totalObtained += (res.marksObtained || 0);
      }
      y += 20;
    });

    // Summary row
    doc.moveTo(50, y).lineTo(500, y).stroke();
    y += 10;
    const avgPercent = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;
    
    doc.text('AVERAGE/TOTAL', 50, y);
    doc.text(totalMax.toString(), 300, y);
    doc.text(totalObtained.toString(), 350, y);
    doc.text(`${avgPercent}%`, 420, y);
    y += 30;

    // Attendance
    doc.fontSize(14).text('Attendance', 50, y, { underline: true });
    y += 20;
    doc.fontSize(10);
    doc.text(`Total Classes: ${totalClasses}`, 50, y);
    doc.text(`Present: ${presentCount}`, 200, y);
    doc.text(`Percentage: ${attendancePercent}%`, 350, y);
    y += 40;

    // Signatures
    y = doc.page.height - 100;
    doc.text('__________________', 50, y);
    doc.text('Class Teacher', 50, y + 15);

    doc.text('__________________', 250, y);
    doc.text('Parent/Guardian', 250, y + 15);

    doc.text('__________________', 420, y);
    doc.text('Principal/Admin', 420, y + 15);

    doc.end();

    stream.on('finish', async () => {
      // For real app, upload to Cloudinary here. 
      // Mocking URL for now.
      const mockCloudinaryUrl = `/api/admin/exams/report-cards/download?file=${path.basename(tmpPath)}`;
      
      try {
        // Save to DB
        await prisma.reportCard.upsert({
          where: {
            studentId_batchId_academicYear_term: {
              studentId,
              batchId,
              academicYear,
              term
            }
          },
          update: { pdfUrl: mockCloudinaryUrl, generatedAt: new Date(), generatedBy },
          create: {
            studentId,
            batchId,
            academicYear,
            term,
            generatedBy,
            pdfUrl: mockCloudinaryUrl
          }
        });

        resolve(mockCloudinaryUrl);
      } catch (err) {
        reject(err);
      }
    });

    stream.on('error', reject);
  });
}
