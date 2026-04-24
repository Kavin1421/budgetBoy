import { z } from "zod";
import {
  ACTUAL_USAGE_PER_DAY,
  DATA_PER_DAY,
  INDIAN_CITIES,
  MEMBER_LINE_USAGE,
  PROVIDERS,
  VALIDITIES,
  WIFI_USAGE_TYPES,
} from "@/utils/constants";
import { actualUsageToGB, planDataPerDayToGB } from "@/lib/memberPlanUtils";

export const memberMobileLineSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    provider: z.enum(PROVIDERS),
    currentPlanPrice: z.number().positive("Recharge price must be greater than 0"),
    validity: z.enum(VALIDITIES),
    planDataPerDay: z.enum(DATA_PER_DAY),
    actualUsagePerDay: z.enum(ACTUAL_USAGE_PER_DAY),
    lineUsageType: z.enum(MEMBER_LINE_USAGE),
  })
  .superRefine((m, ctx) => {
    const planGb = planDataPerDayToGB(m.planDataPerDay);
    const useGb = actualUsageToGB(m.actualUsagePerDay);
    if (useGb > planGb + 0.05) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Actual usage (${m.actualUsagePerDay}) cannot exceed your plan allowance (${m.planDataPerDay}). Increase plan data or lower reported usage.`,
        path: ["actualUsagePerDay"],
      });
    }
    if (useGb <= 0.5 && m.lineUsageType === "heavy") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Heavy line usage rarely matches ≤0.5GB/day actual data — please verify.",
        path: ["lineUsageType"],
      });
    }
  });

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Subscription name is required"),
  cost: z.number().positive("Subscription cost must be greater than 0"),
  used: z.boolean().default(true),
});

export const wifiSchema = z.object({
  cost: z.number().nonnegative(),
  usageType: z.enum(WIFI_USAGE_TYPES),
});

export const wizardSchema = z.object({
  mode: z.enum(["individual", "family", "friends"]),
  city: z.enum(INDIAN_CITIES),
  members: z.array(memberMobileLineSchema).min(1, "Add at least one member with their mobile plan"),
  subscriptions: z.array(subscriptionSchema),
  wifi: wifiSchema,
  income: z.number().nonnegative().optional(),
});

export type WizardInput = z.infer<typeof wizardSchema>;
export type MemberMobileLine = z.infer<typeof memberMobileLineSchema>;
