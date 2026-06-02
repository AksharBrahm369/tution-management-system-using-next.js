import { z } from "zod";

export const generateFeesSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  batchIds: z.array(z.string()).optional(),
});

export const collectFeeSchema = z.object({
  studentId: z.string(),
  feeRecordIds: z.array(z.string()).optional().default([]),
  amount: z.number().min(0),
  paymentMode: z.enum(["CASH", "ONLINE", "CHEQUE", "UPI", "BANK_TRANSFER", "DD"]),
  discountAmount: z.number().optional(),
  discountReason: z.string().optional(),
  transactionDetails: z.any().optional(),
  collectedBy: z.string(),
  notes: z.string().optional(),
  status: z.enum(["PAID", "PENDING"]).optional().default("PAID"),
});

export const createOrderSchema = z.object({
  feeRecordIds: z.array(z.string()),
  studentId: z.string(),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export default { generateFeesSchema, collectFeeSchema, createOrderSchema, verifyPaymentSchema };
