import { optimizeBudgetPreview } from "@/lib/optimizerPreview";
import { wizardSchema } from "@/utils/validators";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const fixture = {
  mode: "family" as const,
  city: "Bangalore" as const,
  members: [
    {
      name: "Kavin",
      provider: "Jio" as const,
      currentPlanPrice: 399,
      validity: "28" as const,
      planDataPerDay: "2GB" as const,
      actualUsagePerDay: "1GB" as const,
      lineUsageType: "medium" as const,
      rechargeIntent: "both-balanced" as const,
      priority: "balanced" as const,
      callingNeed: "regular" as const,
      needsOtt: false,
    },
  ],
  subscriptions: [{ name: "Netflix", cost: 199, used: false }],
  wifi: { cost: 0, usageType: "moderate" as const },
  income: 75000,
};

const parsed = wizardSchema.safeParse(fixture);
assert(parsed.success, "wizardSchema fixture validation failed");

const result = optimizeBudgetPreview(parsed.data);
assert(result.currentCost >= 0, "currentCost must be >= 0");
assert(result.optimizedCost >= 0, "optimizedCost must be >= 0");
assert(result.savings >= 0, "savings must be >= 0");
assert(result.currentCost >= result.optimizedCost, "optimizedCost should not exceed currentCost");
assert(result.memberOptimizations?.length === fixture.members.length, "memberOptimizations length mismatch");
assert(result.planRecommendations?.length === fixture.members.length, "planRecommendations length mismatch");
assert(result.suggestions?.length > 0, "suggestions should not be empty");

console.log("Core optimizer contract tests passed.");
