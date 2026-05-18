interface GradeConfig {
  name: string;
  grades: {
    grade: string;
    minPercentage: number;
    maxPercentage: number;
    gradePoint: number;
    remark?: string | null;
  }[];
}

export function calculateGradeFromConfig(percentage: number | null, config: GradeConfig | null) {
  if (percentage === null || !config || !config.grades) {
    return { grade: null, gradePoint: null, remark: null };
  }

  const matchedRange = config.grades.find(
    (range) => percentage >= range.minPercentage && percentage <= range.maxPercentage
  );

  if (matchedRange) {
    return {
      grade: matchedRange.grade,
      gradePoint: matchedRange.gradePoint,
      remark: matchedRange.remark || null,
    };
  }

  // Fallback if not matching any range (usually F)
  return { grade: "F", gradePoint: 0, remark: "Fail" };
}

export function calculateGrade(marksObtained: number | null, totalMarks: number, config: GradeConfig | null) {
  if (marksObtained === null || totalMarks === 0) {
    return { percentage: null, grade: null, gradePoint: null, remark: null };
  }

  const percentage = parseFloat(((marksObtained / totalMarks) * 100).toFixed(2));
  
  const gradeDetails = calculateGradeFromConfig(percentage, config);

  return {
    percentage,
    ...gradeDetails,
  };
}
