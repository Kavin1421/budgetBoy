import { analyzeBudgetFromDb } from "@/lib/optimizerServer";
import { generateAISuggestions } from "@/lib/openai";
import { getRecommendationTuning } from "@/lib/recommendationTuning";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { enforceWriteGuard } from "@/lib/api/guards";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";
import { wizardSchema } from "@/utils/validators";

export async function postAnalyze(req: Request, ctx: ApiContext) {
  const guardError = enforceWriteGuard(req, ctx, "analyze");
  if (guardError) return guardError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    ctx.log.warn("invalid_json");
    return jsonApiError(400, ApiErrorCodes.INVALID_JSON, "Request body must be valid JSON.", ctx.requestId);
  }

  const parsed = wizardSchema.safeParse(body);
  if (!parsed.success) {
    ctx.log.warn("validation_failed", { issueCount: parsed.error.issues.length });
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "Request validation failed.", ctx.requestId, {
      zod: parsed.error.flatten(),
    });
  }

  try {
    const tuningStart = Date.now();
    const tuning = await getRecommendationTuning().catch(() => ({ providerTuning: {}, planTuning: {} }));
    const tuningDurationMs = Date.now() - tuningStart;

    const optimizerStart = Date.now();
    const base = await analyzeBudgetFromDb(parsed.data, tuning);
    const optimizerDurationMs = Date.now() - optimizerStart;

    const aiStart = Date.now();
    const aiSuggestions = await generateAISuggestions(parsed.data);
    const aiDurationMs = Date.now() - aiStart;
    ctx.log.info("analyze_ok", {
      members: parsed.data.members.length,
      savings: base.savings,
      optimizerDurationMs,
      aiDurationMs,
      tuningDurationMs,
    });
    return jsonSuccess(
      {
        ...base,
        suggestions: [...base.suggestions, ...aiSuggestions].slice(0, 8),
      },
      ctx.requestId
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to analyze budget";
    ctx.log.error("analyze_failed", { err: message });
    return jsonApiError(500, ApiErrorCodes.ANALYSIS_FAILED, message, ctx.requestId);
  }
}
