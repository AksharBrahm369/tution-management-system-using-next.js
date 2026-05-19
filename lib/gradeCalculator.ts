export interface GradeRangeInput {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  remark?: string | null;
  color?: string | null;
}

export interface GradeComputation {
  percentage: number;
  grade: string;
  gradePoint: number;
  remark: string | null;
}

export interface GradeConfig {
  name?: string;
  grades: GradeRangeInput[];
}

export const defaultGradeRanges: GradeRangeInput[] = [
  { grade: "A+", minPercentage: 90, maxPercentage: 100, gradePoint: 10, remark: "Excellent", color: "#10B981" },
  { grade: "A", minPercentage: 80, maxPercentage: 89.99, gradePoint: 9, remark: "Very Good", color: "#22C55E" },
  { grade: "B+", minPercentage: 70, maxPercentage: 79.99, gradePoint: 8, remark: "Good", color: "#3B82F6" },
  { grade: "B", minPercentage: 60, maxPercentage: 69.99, gradePoint: 7, remark: "Above Average", color: "#60A5FA" },
  { grade: "C", minPercentage: 50, maxPercentage: 59.99, gradePoint: 6, remark: "Average", color: "#F59E0B" },
  { grade: "D", minPercentage: 40, maxPercentage: 49.99, gradePoint: 5, remark: "Below Average", color: "#F97316" },
  { grade: "F", minPercentage: 0, maxPercentage: 39.99, gradePoint: 0, remark: "Fail", color: "#EF4444" },
];

function normalizeGradeRanges(config: GradeRangeInput[] | GradeConfig | null | undefined): GradeRangeInput[] {
  if (!config) return defaultGradeRanges;
  if (Array.isArray(config)) return config.length ? config : defaultGradeRanges;
  if (Array.isArray(config.grades) && config.grades.length) return config.grades;
  return defaultGradeRanges;
}

export function calculateGradeFromConfig(
  percentage: number,
  config: GradeRangeInput[] | GradeConfig | null | undefined
): Omit<GradeComputation, "percentage"> {
  const ranges = normalizeGradeRanges(config).sort((a, b) => b.minPercentage - a.minPercentage);
  const matched = ranges.find(
    (range) => percentage >= range.minPercentage && percentage <= range.maxPercentage
  );

  if (!matched) {
    return { grade: "F", gradePoint: 0, remark: "Fail" };
  }

  return {
    grade: matched.grade,
    gradePoint: matched.gradePoint,
    remark: matched.remark ?? null,
  };
}

export function calculateGrade(
  marksObtained: number,
  totalMarks: number,
  config: GradeRangeInput[] | GradeConfig | null | undefined
): GradeComputation {
  if (totalMarks <= 0) {
    return { percentage: 0, grade: "F", gradePoint: 0, remark: "Invalid total marks" };
  }

  const percentage = Number(((marksObtained / totalMarks) * 100).toFixed(2));
  const graded = calculateGradeFromConfig(percentage, config);
  return {
    percentage,
    grade: graded.grade,
    gradePoint: graded.gradePoint,
    remark: graded.remark,
  };
}
