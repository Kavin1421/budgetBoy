import { logger } from "@/lib/logger";
import type { WizardInput } from "@/utils/validators";
import { getCatalogPlansFromDb, getCatalogPlansFromDbCached, invalidateCatalogCache } from "@/lib/dbTelecomPlans";
import type { CatalogTelecomPlan } from "@/lib/telecomTypes";
import type {
  MemberCurrentPlanSnapshot,
  MemberOptimizationResult,
  OptimizationResult,
  PlanRecommendation,
} from "@/lib/optimizerTypes";
import { dataPerRupee, getBestValuePlan, getTrendingPlans, monthlyEquivalent } from "@/lib/telecomPlanQuery";
import { monthlyEquivalentFromRecharge } from "@/lib/billingUtils";
import { getNetworkQuality } from "@/lib/cityNetworkScore";
import { actualUsageToGB, planDataPerDayToGB } from "@/lib/memberPlanUtils";

function scorePlan(p: CatalogTelecomPlan, usageGB: number, city: string): number {
  const m = monthlyEquivalent(p);
  const priceW = 1 / (1 + m / 45);
  const dataMatch = 1 / (1 + Math.abs(p.dataPerDayGB - usageGB));
  const netW = getNetworkQuality(city, p.provider) / 10;
  const rightSized = p.dataPerDayGB <= usageGB + 1.25 ? 1 : 0.88;
  return priceW * 2.25 + dataMatch * 1.65 + netW * 1.45 * rightSized;
}

function optimizeMember(
  member: WizardInput["members"][number],
  index: number,
  city: string,
  catalog: CatalogTelecomPlan[]
): MemberOptimizationResult {
  const validityDays = Number(member.validity) || 28;
  const currentMonthly = monthlyEquivalentFromRecharge(member.currentPlanPrice, validityDays);
  const planGB = planDataPerDayToGB(member.planDataPerDay);
  const usageGB = actualUsageToGB(member.actualUsagePerDay);
  const net = getNetworkQuality(city, member.provider);

  const sameProv = catalog.filter((p) => p.provider === member.provider);
  const affordable = (p: CatalogTelecomPlan) => monthlyEquivalent(p) <= currentMonthly + 0.5;
  const meetsUsage = (p: CatalogTelecomPlan) => p.dataPerDayGB + 1e-6 >= usageGB;

  let pool = sameProv.filter((p) => meetsUsage(p) && affordable(p));
  if (!pool.length) pool = sameProv.filter((p) => meetsUsage(p) && monthlyEquivalent(p) <= currentMonthly * 1.12);
  if (!pool.length) pool = sameProv.filter((p) => meetsUsage(p));

  const scored = pool
    .map((p) => ({ p, s: scorePlan(p, usageGB, city) }))
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      return monthlyEquivalent(a.p) - monthlyEquivalent(b.p);
    });

  let best: CatalogTelecomPlan | null =
    scored.find((x) => monthlyEquivalent(x.p) < currentMonthly - 0.5)?.p ?? null;
  let savings = best ? Math.max(0, currentMonthly - monthlyEquivalent(best)) : 0;

  const valuePool = sameProv.filter((p) => meetsUsage(p) && monthlyEquivalent(p) <= currentMonthly * 1.05);
  const valuePick = [...valuePool].sort((a, b) => dataPerRupee(b) - dataPerRupee(a))[0];

  if (valuePick && (savings < 50 || !best)) {
    const valueSavings = currentMonthly - monthlyEquivalent(valuePick);
    if (!best || savings < 50 || dataPerRupee(valuePick) > dataPerRupee(best) * 1.06) {
      best = valuePick;
      savings = Math.max(0, valueSavings);
    }
  }

  if (!best && scored[0]) {
    best = scored[0].p;
    savings = Math.max(0, currentMonthly - monthlyEquivalent(best));
  }

  const alts = scored
    .map((x) => x.p)
    .filter((p) => p.planId !== best?.planId)
    .slice(0, 2);

  const reasons: string[] = [];
  if (planGB > usageGB + 0.15) {
    reasons.push(
      `Your pack includes ~${planGB}GB/day but you use ~${usageGB}GB/day — you are paying for unused headroom.`
    );
  }
  if (best) {
    const mb = monthlyEquivalent(best);
    if (mb + 1 < currentMonthly) {
      reasons.push(
        `${best.planId} covers ~${usageGB}GB/day at ~Rs.${Math.round(mb)}/mo vs ~Rs.${Math.round(currentMonthly)}/mo today.`
      );
    } else {
      reasons.push(
        `In ${city}, ${member.provider} scores ${net}/10 for coverage — this plan improves data-per-rupee while matching usage.`
      );
    }
  } else {
    reasons.push("No catalog match that clearly beats your current line — prices may already be optimal for this usage.");
  }

  const snap: MemberCurrentPlanSnapshot = {
    name: member.name,
    provider: member.provider,
    currentPlanPrice: member.currentPlanPrice,
    validityDays,
    planDataPerDay: member.planDataPerDay,
    actualUsagePerDay: member.actualUsagePerDay,
    lineUsageType: member.lineUsageType,
    planDataGB: planGB,
    actualUsageGB: usageGB,
    currentMonthlyEquivalent: Math.round(currentMonthly * 100) / 100,
  };

  return {
    name: member.name,
    memberIndex: index,
    currentPlan: snap,
    recommendedPlan: best,
    alternatives: alts,
    savings: Math.round(savings),
    reason: reasons,
    networkScore: net,
  };
}

function toPlanRec(m: MemberOptimizationResult): PlanRecommendation {
  return {
    provider: m.currentPlan.provider,
    memberName: m.name,
    userPlanLabel: `${m.name} · ${m.currentPlan.provider} · ${m.currentPlan.planDataPerDay}/day`,
    currentPrice: m.currentPlan.currentPlanPrice,
    currentValidityDays: m.currentPlan.validityDays,
    currentDataPerDayGB: m.currentPlan.planDataGB,
    currentMonthlyEquivalent: m.currentPlan.currentMonthlyEquivalent,
    bestPlan: m.recommendedPlan,
    alternativePlans: m.alternatives,
    savingsAmount: m.savings,
  };
}

/** Full analysis using MongoDB catalog (server-only). */
export async function analyzeBudgetFromDb(input: WizardInput): Promise<OptimizationResult> {
  const providers = [...new Set(input.members.map((m) => m.provider))];
  logger.info("analyze_budget_from_db", {
    city: input.city,
    members: input.members.length,
    providers,
  });
  let catalog = await getCatalogPlansFromDbCached(providers);
  if (!catalog.length) catalog = await getCatalogPlansFromDbCached();

  if (!catalog.length) {
    const { syncTelecomPlans } = await import("@/lib/telecomSync");
    await syncTelecomPlans({ removeDeprecated: false }).catch(() => undefined);
    invalidateCatalogCache();
    catalog = await getCatalogPlansFromDbCached(providers.length ? providers : undefined);
    if (!catalog.length) catalog = await getCatalogPlansFromDb();
  }

  const memberOptimizations = input.members.map((m, i) => optimizeMember(m, i, input.city, catalog));

  const telecomSavings = memberOptimizations.reduce((s, m) => s + m.savings, 0);
  const plansMonthly = input.members.reduce(
    (s, m) => s + monthlyEquivalentFromRecharge(m.currentPlanPrice, Number(m.validity) || 28),
    0
  );
  const subsMonthly = input.subscriptions.reduce((sum, x) => sum + x.cost, 0);
  const wifiMonthly = input.wifi.cost;
  const currentCost = plansMonthly + subsMonthly + wifiMonthly;
  let optimizedCost = currentCost - telecomSavings;

  let totalOverpayEst = 0;
  memberOptimizations.forEach((m) => {
    const over = m.currentPlan.planDataGB - m.currentPlan.actualUsageGB;
    if (over > 0.25) {
      totalOverpayEst += Math.min(
        m.currentPlan.currentMonthlyEquivalent * 0.12,
        m.currentPlan.currentMonthlyEquivalent * (over / Math.max(m.currentPlan.planDataGB, 0.5)) * 0.4
      );
    }
  });

  const suggestions: string[] = [];

  memberOptimizations.forEach((m) => {
    if (m.recommendedPlan && m.savings >= 50) {
      suggestions.push(`${m.name}: move toward ${m.recommendedPlan.planId} — about Rs.${m.savings}/mo saved.`);
    } else if (m.recommendedPlan) {
      suggestions.push(`${m.name}: ${m.recommendedPlan.planId} is a stronger value pick for ${input.city} (savings under Rs.50/mo but better fit).`);
    }
  });

  const uniqProviders = new Set(input.members.map((m) => m.provider));
  if (uniqProviders.size >= 3) {
    suggestions.push(
      "Multiple providers detected — merging lines onto one network (where family plans exist) can cut bill shock and simplify renewals."
    );
  }

  const ottish = input.subscriptions.filter((s) => /prime|netflix|hotstar|sony|zee5|ott|cinema/i.test(s.name));
  if (ottish.length >= 2) {
    suggestions.push("OTT overlap: several streaming-style subscriptions — share one family plan or drop duplicates.");
  }

  const providerCounts = input.members.reduce<Record<string, number>>((acc, m) => {
    acc[m.provider] = (acc[m.provider] || 0) + 1;
    return acc;
  }, {});
  Object.entries(providerCounts).forEach(([prov, count]) => {
    if (count >= 2) {
      const family = catalog.find((c) => c.provider === prov && c.category === "family");
      if (family) suggestions.push(`${count} ${prov} lines: compare ${family.planId} vs separate packs.`);
    }
  });

  input.subscriptions.forEach((sub) => {
    if (!sub.used) {
      optimizedCost -= sub.cost;
      suggestions.push(`Cancel unused subscription: ${sub.name} (Rs.${sub.cost}/mo).`);
    }
  });

  optimizedCost = Math.max(0, Math.round(optimizedCost));
  const savings = Math.max(0, Math.round(currentCost - optimizedCost));

  const overpaySummary =
    totalOverpayEst > 40
      ? `You may be overpaying by about Rs.${Math.round(totalOverpayEst)}/mo on mobile data you do not fully use (estimate from plan vs actual usage).`
      : undefined;

  return {
    currentCost: Math.round(currentCost),
    optimizedCost,
    savings,
    savingsAmount: savings,
    suggestions: suggestions.length ? suggestions : ["Looks competitive — rerun after your next recharge."],
    planRecommendations: memberOptimizations.map(toPlanRec),
    memberOptimizations,
    totalFamilyTelecomSavings: Math.round(telecomSavings),
    overpaySummary,
    bestValuePlan: getBestValuePlan(catalog),
    trendingPlans: getTrendingPlans(catalog, 5),
  };
}
