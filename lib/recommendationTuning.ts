import { RecommendationFeedback } from "@/models/RecommendationFeedback";

type ProviderTuning = Record<string, number>;
type PlanTuning = Record<string, number>;

let cache: { expiresAt: number; providerTuning: ProviderTuning; planTuning: PlanTuning } | null = null;

function toMultiplier(acceptRate: number) {
  return Math.min(1.12, Math.max(0.9, 0.95 + acceptRate * 0.2));
}

export async function getRecommendationTuning(): Promise<{ providerTuning: ProviderTuning; planTuning: PlanTuning }> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return { providerTuning: cache.providerTuning, planTuning: cache.planTuning };
  }

  const since = new Date(now - 1000 * 60 * 60 * 24 * 30);
  const providerAgg = await RecommendationFeedback.aggregate<{ _id: string; total: number; accepted: number }>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$provider",
        total: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ["$action", "accepted_switch"] }, 1, 0] } },
      },
    },
  ]);

  const planAgg = await RecommendationFeedback.aggregate<{ _id: string; total: number; accepted: number }>([
    { $match: { createdAt: { $gte: since }, recommendedPlanId: { $type: "string", $ne: "" } } },
    {
      $group: {
        _id: "$recommendedPlanId",
        total: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ["$action", "accepted_switch"] }, 1, 0] } },
      },
    },
  ]);

  const providerTuning: ProviderTuning = {};
  for (const row of providerAgg) {
    if (!row._id || row.total <= 0) continue;
    providerTuning[row._id] = toMultiplier(row.accepted / row.total);
  }

  const planTuning: PlanTuning = {};
  for (const row of planAgg) {
    if (!row._id || row.total <= 0) continue;
    planTuning[row._id] = toMultiplier(row.accepted / row.total);
  }

  cache = {
    expiresAt: now + 1000 * 60 * 10,
    providerTuning,
    planTuning,
  };
  return { providerTuning, planTuning };
}
