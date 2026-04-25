import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import { RecommendationFeedback } from "@/models/RecommendationFeedback";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { enforceWriteGuard } from "@/lib/api/guards";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";

const recommendationFeedbackSchema = z.object({
  provider: z.enum(["Jio", "Airtel", "VI", "BSNL"]),
  recommendedPlanId: z.string().trim().min(1).max(140).optional(),
  action: z.enum(["accepted_switch", "dismissed_switch", "kept_current"]),
  city: z.string().trim().min(1).max(40).optional(),
  memberName: z.string().trim().min(1).max(80).optional(),
});

export async function postRecommendationFeedback(req: Request, ctx: ApiContext) {
  const guardError = enforceWriteGuard(req, ctx, "recommendation_feedback");
  if (guardError) return guardError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, ApiErrorCodes.INVALID_JSON, "Request body must be valid JSON.", ctx.requestId);
  }

  const parsed = recommendationFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "Request validation failed.", ctx.requestId, {
      zod: parsed.error.flatten(),
    });
  }

  try {
    await connectToDB();
    await RecommendationFeedback.create({
      provider: parsed.data.provider,
      recommendedPlanId: parsed.data.recommendedPlanId ?? null,
      action: parsed.data.action,
      city: parsed.data.city ?? null,
      memberName: parsed.data.memberName ?? null,
    });
    return jsonSuccess({ success: true }, ctx.requestId, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to store recommendation feedback";
    return jsonApiError(500, ApiErrorCodes.DATABASE_ERROR, message, ctx.requestId);
  }
}
