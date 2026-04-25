import type { CatalogTelecomPlan } from "@/lib/telecomTypes";

/** Legacy shape (charts / older UI); derived from per-member results when possible. */
export type PlanRecommendation = {
  provider: string;
  userPlanLabel: string;
  currentPrice: number;
  currentValidityDays: number;
  currentDataPerDayGB: number;
  currentMonthlyEquivalent: number;
  bestPlan: CatalogTelecomPlan | null;
  alternativePlans: CatalogTelecomPlan[];
  savingsAmount: number;
  memberName?: string;
};

export type MemberCurrentPlanSnapshot = {
  name: string;
  provider: string;
  rechargeIntent: string;
  priority: string;
  callingNeed: string;
  needsOtt: boolean;
  currentPlanPrice: number;
  validityDays: number;
  planDataPerDay: string;
  actualUsagePerDay: string;
  lineUsageType: string;
  planDataGB: number;
  actualUsageGB: number;
  currentMonthlyEquivalent: number;
};

export type MemberOptimizationResult = {
  name: string;
  memberIndex: number;
  currentPlan: MemberCurrentPlanSnapshot;
  verdict: "keep_current" | "switch_recommended";
  currentFitScore: number;
  recommendedFitScore: number;
  confidence: "high" | "medium" | "low";
  wasteBreakdown: {
    unusedDataCost: number;
    overSpecCost: number;
    networkPenaltyCost: number;
    ottMismatchCost: number;
  };
  recommendedPlan: CatalogTelecomPlan | null;
  alternatives: CatalogTelecomPlan[];
  savings: number;
  reason: string[];
  networkScore: number;
};

export type OptimizationResult = {
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsAmount: number;
  suggestions: string[];
  planRecommendations: PlanRecommendation[];
  /** Present after new optimizer; older saved analyses may omit. */
  memberOptimizations?: MemberOptimizationResult[];
  totalFamilyTelecomSavings?: number;
  overpaySummary?: string;
  bestValuePlan: CatalogTelecomPlan | null;
  trendingPlans: CatalogTelecomPlan[];
};
