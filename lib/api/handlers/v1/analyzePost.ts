import { analyzeBudgetFromDb } from "@/lib/optimizerServer";
import { generateAISuggestions } from "@/lib/openai";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";
import { wizardSchema } from "@/utils/validators";

export async function postAnalyze(req: Request, ctx: ApiContext) {
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
    const base = await analyzeBudgetFromDb(parsed.data);
    const aiSuggestions = await generateAISuggestions(parsed.data);
    ctx.log.info("analyze_ok", {
      members: parsed.data.members.length,
      savings: base.savings,
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
