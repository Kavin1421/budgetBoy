/** Monthly equivalent from recharge price and validity (days). */
export function monthlyEquivalentFromRecharge(price: number, validityDays: number): number {
  const v = validityDays > 0 ? validityDays : 28;
  return (price * 30) / v;
}

/** Normalize subscription charge to monthly equivalent. */
export function monthlySubscriptionCost(cost: number, billingCycle?: "monthly" | "yearly"): number {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  return billingCycle === "yearly" ? cost / 12 : cost;
}
