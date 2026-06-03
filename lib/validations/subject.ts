import { z } from "zod";

/**
 * Zod schema for validating the creation of a Subject.
 */
export const subjectCreateSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters long"),
  code: z.string().min(1, "Subject code is required and must be unique").toUpperCase(),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

/**
 * Zod schema for validating updates to a Subject.
 */
export const subjectUpdateSchema = subjectCreateSchema.partial();
