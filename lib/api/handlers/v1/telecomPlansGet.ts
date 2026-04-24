import { getTelecomPlans } from "@/lib/telecomProvider";
import { getBestValuePlan, getTrendingPlans, dataPerRupee } from "@/lib/telecomPlanQuery";
import { PROVIDERS } from "@/utils/constants";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";

export async function getTelecomPlansHandler(req: Request, ctx: ApiContext) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") ?? "Jio";
  if (!(PROVIDERS as readonly string[]).includes(provider)) {
    ctx.log.warn("invalid_provider", { provider });
    return jsonApiError(400, ApiErrorCodes.INVALID_PROVIDER, "Unknown provider.", ctx.requestId, {
      allowed: [...PROVIDERS],
    });
  }

  try {
    const plans = await getTelecomPlans(provider);
    const withMetrics = plans.map((p) => ({
      ...p,
      dataPerRupee: Math.round(dataPerRupee(p) * 10000) / 10000,
    }));
    const trendingPlans = getTrendingPlans(plans, 5);
    const bestValuePlan = getBestValuePlan(plans);
    ctx.log.info("telecom_plans_ok", { provider, count: plans.length });
    return jsonSuccess(
      {
        plans: withMetrics,
        trendingPlans,
        bestValuePlan,
      },
      ctx.requestId
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load plans";
    ctx.log.error("telecom_plans_failed", { err: message, provider });
    return jsonApiError(500, ApiErrorCodes.TELECOM_FETCH_FAILED, message, ctx.requestId);
  }
}
