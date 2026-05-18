import prisma from "./prisma";

export async function getClassPerformance(examId: string) {
  const results = await prisma.examResult.findMany({
    where: { examId, status: { not: "PENDING" } }
  });

  if (results.length === 0) return null;

  let totalScore = 0;
  let highest = 0;
  let lowest = 10000;
  let passCount = 0;
  let failCount = 0;
  let absentCount = 0;

  const gradeDistribution: Record<string, number> = {};

  results.forEach(r => {
    if (r.isAbsent) {
      absentCount++;
      return;
    }

    const marks = r.marksObtained || 0;
    totalScore += marks;
    
    if (marks > highest) highest = marks;
    if (marks < lowest) lowest = marks;

    if (r.grade === "F") failCount++;
    else passCount++;

    const g = r.grade || "None";
    gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
  });

  const presentCount = results.length - absentCount;
  const average = presentCount > 0 ? totalScore / presentCount : 0;

  return {
    average: parseFloat(average.toFixed(2)),
    highest,
    lowest: lowest === 10000 ? 0 : lowest,
    passRate: presentCount > 0 ? (passCount / presentCount) * 100 : 0,
    failRate: presentCount > 0 ? (failCount / presentCount) * 100 : 0,
    absentRate: (absentCount / results.length) * 100,
    gradeDistribution,
    totalStudents: results.length,
    presentCount,
    passCount,
    failCount,
    absentCount
  };
}

export async function getStudentPerformanceTrend(studentId: string, batchId: string, limit = 5) {
  const results = await prisma.examResult.findMany({
    where: { studentId, batchId, exam: { isResultPublished: true } },
    include: { exam: { select: { title: true, examDate: true, type: true } } },
    orderBy: { exam: { examDate: 'asc' } },
    take: limit
  });
  return results;
}

export async function identifyWeakAreas(batchId: string, examIds: string[]) {
  // Only applicable for online exams where questions have topics
  const answers = await prisma.studentAnswer.findMany({
    where: {
      question: { examId: { in: examIds } },
      student: { batchEnrollments: { some: { batchId, isActive: true } } }
    },
    include: { question: true }
  });

  const topicStats: Record<string, { total: number, correct: number }> = {};

  answers.forEach(a => {
    const topic = a.question.topic;
    if (!topic) return;

    if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
    topicStats[topic].total++;
    if (a.isCorrect) topicStats[topic].correct++;
  });

  const weakTopics = [];
  for (const topic in topicStats) {
    const stat = topicStats[topic];
    if (stat.total > 0 && (stat.correct / stat.total) < 0.5) {
      weakTopics.push({ topic, average: (stat.correct / stat.total) * 100 });
    }
  }

  return weakTopics.sort((a, b) => a.average - b.average);
}

export async function getToppers(examId: string, limit = 5) {
  return prisma.examResult.findMany({
    where: { examId, isAbsent: false, status: { not: "PENDING" } },
    include: { student: { select: { firstName: true, lastName: true, profilePhoto: true, studentCode: true } } },
    orderBy: { marksObtained: 'desc' },
    take: limit
  });
}
