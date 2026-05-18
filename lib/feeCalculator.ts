import prisma from "./prisma";

export type FeeBreakdown = {
  baseFee: number;
  lateFee: number;
  discountAmount: number;
  scholarshipAmount: number;
  otherCharges: number;
  gstAmount: number;
  totalDue: number;
  dueDate: Date;
};

export async function calculateLateFee(feeStructure: any, dueDate: Date, baseFee: number): Promise<number> {
  if (!feeStructure || !feeStructure.lateFeeEnabled) return 0;
  const now = new Date();
  const graceEnd = new Date(dueDate);
  graceEnd.setDate(graceEnd.getDate() + (feeStructure.lateFeeAfterDays || 0));
  if (now <= graceEnd) return 0;

  if (feeStructure.lateFeeType === "FIXED") return feeStructure.lateFeeAmount || 0;
  if (feeStructure.lateFeeType === "PERCENTAGE") return ((feeStructure.lateFeeAmount || 0) / 100) * baseFee;
  if (feeStructure.lateFeeType === "PER_DAY") {
    const days = Math.ceil((now.getTime() - graceEnd.getTime()) / (1000 * 60 * 60 * 24));
    return (feeStructure.lateFeeAmount || 0) * days;
  }
  return 0;
}

export async function calculateFeeForStudent(studentId: string, batchId: string, month: number, year: number): Promise<FeeBreakdown> {
  const feeStructure = await prisma.feeStructure.findFirst({ where: { batchId } });
  const baseFee = feeStructure ? feeStructure.tuitionFee : 0;

  const dueDate = feeStructure
    ? new Date(year, month - 1, feeStructure.dueDateDay || 10)
    : new Date(year, month - 1, 10);

  const lateFee = await calculateLateFee(feeStructure, dueDate, baseFee);

  // discounts
  const discounts = await prisma.discount.findMany({ where: { studentId, isActive: true } });
  const discountAmount = discounts.reduce((acc, d) => {
    if (d.type === "PERCENTAGE") return acc + (d.value / 100) * baseFee;
    return acc + d.value;
  }, 0);

  // scholarships
  const scholarships = await prisma.scholarship.findMany({ where: { studentId, isActive: true } });
  const scholarshipAmount = scholarships.reduce((acc, s) => acc + (s.amount || 0), 0);

  const otherCharges = 0;
  const gstAmount = feeStructure && feeStructure.isGSTApplicable ? (baseFee * (feeStructure.gstPercentage || 18)) / 100 : 0;

  const totalDue = parseFloat((baseFee + lateFee + otherCharges + gstAmount - discountAmount - scholarshipAmount).toFixed(2));

  return {
    baseFee,
    lateFee: parseFloat(lateFee.toFixed(2)),
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    scholarshipAmount: parseFloat(scholarshipAmount.toFixed(2)),
    otherCharges: parseFloat(otherCharges.toFixed(2)),
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    totalDue,
    dueDate,
  };
}

export default { calculateFeeForStudent, calculateLateFee };
