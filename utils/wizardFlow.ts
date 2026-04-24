import { z } from "zod";
import { INDIAN_CITIES } from "@/utils/constants";
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
    members: state.members,
    subscriptions: state.subscriptions,
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
