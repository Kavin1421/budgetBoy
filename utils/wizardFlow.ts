import { z } from "zod";
import {
  BILL_SHOCK_TOLERANCE,
  CALLING_NEEDS,
  CALL_QUALITY_SENSITIVITY,
  DATA_ROLLOVER_RISK_WINDOWS,
  INDIAN_CITIES,
  MEMBER_PRIORITIES,
  MEMBER_RECHARGE_INTENTS,
  RECHARGE_FRICTION_PREFERENCES,
} from "@/utils/constants";
import {
  memberMobileLineSchema,
  subscriptionSchema,
  wifiSchema,
  wizardSchema,
  type WizardInput,
} from "@/utils/validators";

const modeSchema = z.enum(["individual", "family", "friends"]);
const citySchema = z.enum(INDIAN_CITIES);
const membersStepSchema = z.array(memberMobileLineSchema).min(1, "Add at least one member with a valid mobile line");
const subscriptionsStepSchema = z.array(subscriptionSchema);
const incomeStepSchema = z.object({
  income: z.number().nonnegative("Income cannot be negative").optional(),
});

export type WizardStoreSlice = Pick<WizardInput, "mode" | "city" | "members" | "subscriptions" | "wifi"> & {
  income?: number;
};

function normalizeMember(
  member: WizardStoreSlice["members"][number]
): WizardInput["members"][number] {
  const fallbackIntent =
    member.lineUsageType === "calls-only"
      ? "calls-only"
      : member.lineUsageType === "heavy"
        ? "streaming-heavy"
        : "both-balanced";

  const rechargeIntent = MEMBER_RECHARGE_INTENTS.includes(
    (member as Partial<WizardInput["members"][number]>).rechargeIntent as (typeof MEMBER_RECHARGE_INTENTS)[number]
  )
    ? ((member as WizardInput["members"][number]).rechargeIntent as (typeof MEMBER_RECHARGE_INTENTS)[number])
    : fallbackIntent;

  const priority = MEMBER_PRIORITIES.includes(
    (member as Partial<WizardInput["members"][number]>).priority as (typeof MEMBER_PRIORITIES)[number]
  )
    ? ((member as WizardInput["members"][number]).priority as (typeof MEMBER_PRIORITIES)[number])
    : "balanced";

  const callingNeed = CALLING_NEEDS.includes(
    (member as Partial<WizardInput["members"][number]>).callingNeed as (typeof CALLING_NEEDS)[number]
  )
    ? ((member as WizardInput["members"][number]).callingNeed as (typeof CALLING_NEEDS)[number])
    : member.lineUsageType === "calls-only"
      ? "high"
      : "regular";

  const needsOtt =
    typeof (member as Partial<WizardInput["members"][number]>).needsOtt === "boolean"
      ? Boolean((member as WizardInput["members"][number]).needsOtt)
      : rechargeIntent === "streaming-heavy";

  return {
    ...member,
    rechargeIntent,
    priority,
    callingNeed,
    needsOtt,
    networkConfidence:
      Number.isFinite((member as Partial<WizardInput["members"][number]>).networkConfidence) &&
      Number((member as Partial<WizardInput["members"][number]>).networkConfidence) >= 1 &&
      Number((member as Partial<WizardInput["members"][number]>).networkConfidence) <= 5
        ? Number((member as Partial<WizardInput["members"][number]>).networkConfidence)
        : 3,
    rechargeFrictionPreference: RECHARGE_FRICTION_PREFERENCES.includes(
      (member as Partial<WizardInput["members"][number]>).rechargeFrictionPreference as (typeof RECHARGE_FRICTION_PREFERENCES)[number]
    )
      ? ((member as WizardInput["members"][number]).rechargeFrictionPreference as (typeof RECHARGE_FRICTION_PREFERENCES)[number])
      : "medium",
    dataRolloverRiskWindow: DATA_ROLLOVER_RISK_WINDOWS.includes(
      (member as Partial<WizardInput["members"][number]>).dataRolloverRiskWindow as (typeof DATA_ROLLOVER_RISK_WINDOWS)[number]
    )
      ? ((member as WizardInput["members"][number]).dataRolloverRiskWindow as (typeof DATA_ROLLOVER_RISK_WINDOWS)[number])
      : "1-3",
    hotspotNeeded:
      typeof (member as Partial<WizardInput["members"][number]>).hotspotNeeded === "boolean"
        ? Boolean((member as WizardInput["members"][number]).hotspotNeeded)
        : false,
    callQualitySensitivity: CALL_QUALITY_SENSITIVITY.includes(
      (member as Partial<WizardInput["members"][number]>).callQualitySensitivity as (typeof CALL_QUALITY_SENSITIVITY)[number]
    )
      ? ((member as WizardInput["members"][number]).callQualitySensitivity as (typeof CALL_QUALITY_SENSITIVITY)[number])
      : "medium",
    billShockTolerance: BILL_SHOCK_TOLERANCE.includes(
      (member as Partial<WizardInput["members"][number]>).billShockTolerance as (typeof BILL_SHOCK_TOLERANCE)[number]
    )
      ? ((member as WizardInput["members"][number]).billShockTolerance as (typeof BILL_SHOCK_TOLERANCE)[number])
      : "yes",
  };
}

function normalizeSubscription(
  sub: WizardStoreSlice["subscriptions"][number]
): WizardInput["subscriptions"][number] {
  const billingCycle = (sub as Partial<WizardInput["subscriptions"][number]>).billingCycle;
  return {
    ...sub,
    billingCycle: billingCycle === "yearly" ? "yearly" : "monthly",
  };
}

/** Coerce WiFi / income numbers so Zod never sees NaN from cleared inputs. */
export function normalizeWizardFromStore(state: WizardStoreSlice): WizardInput {
  const w = Number(state.wifi.cost);
  const wifiCost = Number.isFinite(w) && w >= 0 ? w : 0;
  let income: number | undefined = state.income;
  if (income !== undefined && income !== null) {
    const n = Number(income);
    income = Number.isFinite(n) ? n : undefined;
  }
  return {
    mode: state.mode,
    city: state.city,
    members: state.members.map(normalizeMember),
    subscriptions: state.subscriptions.map(normalizeSubscription),
    wifi: {
      ...state.wifi,
      cost: wifiCost,
    },
    income,
  };
}

export function validateWizardStep(
  stepIndex: number,
  data: WizardInput
): { ok: true } | { ok: false; message: string } {
  switch (stepIndex) {
    case 0: {
      const r = modeSchema.safeParse(data.mode);
      return r.success ? { ok: true } : { ok: false, message: r.error.issues[0]?.message ?? "Choose a household mode." };
    }
    case 1: {
      const r = citySchema.safeParse(data.city);
      return r.success ? { ok: true } : { ok: false, message: r.error.issues[0]?.message ?? "Pick your city." };
    }
    case 2: {
      const r = membersStepSchema.safeParse(data.members);
      return r.success ? { ok: true } : { ok: false, message: r.error.issues[0]?.message ?? "Fix member details." };
    }
    case 3: {
      const r = wifiSchema.safeParse(data.wifi);
      return r.success ? { ok: true } : { ok: false, message: r.error.issues[0]?.message ?? "Check WiFi cost and usage." };
    }
    case 4: {
      const r = subscriptionsStepSchema.safeParse(data.subscriptions);
      return r.success ? { ok: true } : { ok: false, message: r.error.issues[0]?.message ?? "Fix subscription rows." };
    }
    case 5: {
      const r = incomeStepSchema.safeParse({ income: data.income });
      return r.success ? { ok: true } : { ok: false, message: r.error.issues[0]?.message ?? "Income must be a non-negative number or left blank." };
    }
    case 6: {
      const r = wizardSchema.safeParse(data);
      return r.success ? { ok: true } : { ok: false, message: r.error.issues[0]?.message ?? "Something still needs attention — go back and review." };
    }
    default:
      return { ok: false, message: "Unknown step." };
  }
}
