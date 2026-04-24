import type { CatalogTelecomPlan } from "@/lib/telecomTypes";

/** Monthly equivalent recharge cost (normalized to ~30 days). */
export function monthlyEquivalent(plan: CatalogTelecomPlan): number {
  if (!plan.validityDays) return plan.price;
  return (plan.price * 30) / plan.validityDays;
}

/** Data delivered per rupee per month (higher is better value). */
export function dataPerRupee(plan: CatalogTelecomPlan): number {
  const m = monthlyEquivalent(plan);
  if (m <= 0) return 0;
  return plan.dataPerDayGB / m;
}

export function getPlansByProvider(provider: string, catalog: CatalogTelecomPlan[]): CatalogTelecomPlan[] {
  const p = provider.trim();
  return catalog.filter((x) => x.provider === p);
}

/** Cheapest plan meeting minimum daily data (same provider filter optional). */
export function getCheapestPlan(
  minDataPerDayGB: number,
  catalog: CatalogTelecomPlan[],
  opts?: { provider?: string; maxMonthly?: number }
): CatalogTelecomPlan | null {
  let list = catalog.filter((x) => x.dataPerDayGB >= minDataPerDayGB);
  if (opts?.provider) list = list.filter((x) => x.provider === opts.provider);
  if (opts?.maxMonthly != null && Number.isFinite(opts.maxMonthly)) {
    const cap = opts.maxMonthly;
    list = list.filter((x) => monthlyEquivalent(x) <= cap);
  }
  if (!list.length) return null;
  return list.reduce((best, cur) => (monthlyEquivalent(cur) < monthlyEquivalent(best) ? cur : best));
}

/**
 * Best plan for estimated daily usage (GB) and optional monthly budget cap.
 * Prefers lowest monthly cost that still meets usage, then best data-per-rupee tie-break.
 */
export function getBestPlanByUsage(
  dataUsagePerDayGB: number,
  budgetMonthly: number | undefined,
  catalog: CatalogTelecomPlan[]
): CatalogTelecomPlan | null {
  const minData = Math.max(0.5, dataUsagePerDayGB);
  let candidates = catalog.filter((p) => p.dataPerDayGB >= minData * 0.95);
  if (budgetMonthly != null && Number.isFinite(budgetMonthly)) {
    candidates = candidates.filter((p) => monthlyEquivalent(p) <= budgetMonthly * 1.05);
  }
  if (!candidates.length) {
    candidates = catalog.filter((p) => p.dataPerDayGB >= minData * 0.8);
  }
  if (!candidates.length) return null;

  candidates.sort((a, b) => {
    const ma = monthlyEquivalent(a);
    const mb = monthlyEquivalent(b);
    if (ma !== mb) return ma - mb;
    return dataPerRupee(b) - dataPerRupee(a);
  });
  return candidates[0] ?? null;
}

export function getBestValuePlan(catalog: CatalogTelecomPlan[]): CatalogTelecomPlan | null {
  if (!catalog.length) return null;
  return catalog.reduce((best, cur) => (dataPerRupee(cur) > dataPerRupee(best) ? cur : best));
}

export function getTrendingPlans(catalog: CatalogTelecomPlan[], limit = 5): CatalogTelecomPlan[] {
  const popular = catalog.filter((p) => p.category === "popular" || p.category === "mid-range");
  const pool = popular.length ? popular : catalog;
  return [...pool].sort((a, b) => monthlyEquivalent(a) - monthlyEquivalent(b)).slice(0, limit);
}
