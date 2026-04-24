import { z } from "zod";

const catalogPlanSchema = z.object({
  planId: z.string().min(1),
  price: z.number().positive(),
  validityDays: z.number().int().positive(),
  dataPerDayGB: z.number().nonnegative(),
  totalDataGB: z.number().nonnegative(),
  calls: z.string().min(1),
  smsPerDay: z.number().nonnegative(),
  ottBenefits: z.array(z.string()),
  category: z.string().min(1),
  lastUpdated: z.string().min(1),
});

export const telecomFileSchema = z.object({
  provider: z.string().min(1),
  plans: z.array(catalogPlanSchema).min(1),
});

export type TelecomFileParsed = z.infer<typeof telecomFileSchema>;

/** Validate file + ensure unique planIds within file */
export function validateTelecomFile(data: unknown): { ok: true; data: TelecomFileParsed } | { ok: false; error: string } {
  const parsed = telecomFileSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid telecom JSON" };
  }
  const seen = new Set<string>();
  for (const p of parsed.data.plans) {
    if (seen.has(p.planId)) return { ok: false, error: `Duplicate planId in file: ${p.planId}` };
    seen.add(p.planId);
  }
  return { ok: true, data: parsed.data };
}
