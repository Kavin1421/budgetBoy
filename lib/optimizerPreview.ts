import type { WizardInput } from "@/utils/validators";
import type { MemberCurrentPlanSnapshot, MemberOptimizationResult, OptimizationResult, PlanRecommendation } from "@/lib/optimizerTypes";
import { monthlyEquivalentFromRecharge } from "@/lib/billingUtils";
import { getNetworkQuality } from "@/lib/cityNetworkScore";
import { actualUsageToGB, planDataPerDayToGB } from "@/lib/memberPlanUtils";

/** Synchronous preview (no DB). */
export function optimizeBudgetPreview(input: WizardInput): Omit<OptimizationResult, "bestValuePlan" | "trendingPlans"> & {
  bestValuePlan: null;
  trendingPlans: [];
} {
  const plansMonthly = input.members.reduce(
    (s, m) => s + monthlyEquivalentFromRecharge(m.currentPlanPrice, Number(m.validity) || 28),
    0
  );
  const subsMonthly = input.subscriptions.reduce((sum, s) => sum + s.cost, 0);
  const wifiMonthly = input.wifi.cost;
  const currentCost = plansMonthly + subsMonthly + wifiMonthly;

  let optimizedCost = currentCost;
  const suggestions: string[] = [];
  const memberOptimizations: MemberOptimizationResult[] = [];

  input.members.forEach((m, i) => {
    const validityDays = Number(m.validity) || 28;
    const currentMonthly = monthlyEquivalentFromRecharge(m.currentPlanPrice, validityDays);
    const planGB = planDataPerDayToGB(m.planDataPerDay);
    const usageGB = actualUsageToGB(m.actualUsagePerDay);
    const net = getNetworkQuality(input.city, m.provider);
    let save = 0;
    const reasons: string[] = [];
    const overData = Math.max(0, planGB - usageGB);
    const unusedDataCost = Math.round(currentMonthly * Math.min(0.35, overData * 0.12));

    if (planGB > usageGB + 0.2) {
      save = Math.round(currentMonthly * 0.1);
      optimizedCost -= save;
      reasons.push(`Pack ~${planGB}GB/day vs ~${usageGB}GB/day used — preview assumes ~10% waste on this line.`);
      suggestions.push(`${m.name}: likely paying for extra data — full catalog match after submit.`);
    } else {
      reasons.push("Submit for DB-backed picks; preview shows no obvious waste on data alone.");
    }

    const snap: MemberCurrentPlanSnapshot = {
      name: m.name,
      provider: m.provider,
      rechargeIntent: m.rechargeIntent,
      priority: m.priority,
      callingNeed: m.callingNeed,
      needsOtt: m.needsOtt,
      currentPlanPrice: m.currentPlanPrice,
      validityDays,
      planDataPerDay: m.planDataPerDay,
      actualUsagePerDay: m.actualUsagePerDay,
      lineUsageType: m.lineUsageType,
      planDataGB: planGB,
      actualUsageGB: usageGB,
      currentMonthlyEquivalent: Math.round(currentMonthly * 100) / 100,
    };

    memberOptimizations.push({
      name: m.name,
      memberIndex: i,
      currentPlan: snap,
      verdict: save >= 30 ? "switch_recommended" : "keep_current",
      currentFitScore: Math.max(10, Math.min(100, Math.round(65 - overData * 10 + (net - 5) * 3))),
      recommendedFitScore: Math.max(10, Math.min(100, Math.round(70 - overData * 6 + (net - 5) * 3))),
      confidence: save >= 70 ? "high" : save >= 30 ? "medium" : "low",
      wasteBreakdown: {
        unusedDataCost,
        overSpecCost: Math.round(Math.max(0, currentMonthly * (validityDays > 84 ? 0.06 : 0))),
        networkPenaltyCost: Math.round(Math.max(0, (6 - net) * 5)),
        ottMismatchCost: m.needsOtt ? Math.round(Math.max(0, currentMonthly * 0.04)) : 0,
      },
      recommendedPlan: null,
      alternatives: [],
      savings: save,
      reason: reasons,
      networkScore: net,
    });
  });

  const uniq = new Set(input.members.map((m) => m.provider));
  if (uniq.size >= 3) {
    suggestions.push("Multiple providers — consider consolidating after full analysis.");
  }

  input.subscriptions.forEach((sub) => {
    if (!sub.used) {
      optimizedCost -= sub.cost;
      suggestions.push(`Cancel unused subscription: ${sub.name} (Rs.${sub.cost}/mo).`);
    }
  });

  optimizedCost = Math.max(optimizedCost, 0);
  const savings = Math.max(currentCost - optimizedCost, 0);

  const planRecommendations: PlanRecommendation[] = memberOptimizations.map((m) => ({
    provider: m.currentPlan.provider,
    memberName: m.name,
    userPlanLabel: `${m.name} · ${m.currentPlan.provider}`,
    currentPrice: m.currentPlan.currentPlanPrice,
    currentValidityDays: m.currentPlan.validityDays,
    currentDataPerDayGB: m.currentPlan.planDataGB,
    currentMonthlyEquivalent: m.currentPlan.currentMonthlyEquivalent,
    bestPlan: null,
    alternativePlans: [],
    savingsAmount: m.savings,
  }));

  return {
    currentCost: Math.round(currentCost),
    optimizedCost: Math.round(optimizedCost),
    savings: Math.round(savings),
    savingsAmount: Math.round(savings),
    suggestions: suggestions.length ? suggestions : ["Complete the wizard and submit for advisor-grade picks."],
    planRecommendations,
    memberOptimizations,
    totalFamilyTelecomSavings: memberOptimizations.reduce((s, m) => s + m.savings, 0),
    overpaySummary: undefined,
    bestValuePlan: null,
    trendingPlans: [],
  };
}
