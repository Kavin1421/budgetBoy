import { connectToDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";
import { wizardSchema } from "@/utils/validators";

export async function postUser(req: Request, ctx: ApiContext) {
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
    await connectToDB();
    const created = await User.create(parsed.data);
    ctx.log.info("user_created", { id: String(created._id) });
    return jsonSuccess({ id: String(created._id), success: true }, ctx.requestId, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save user";
    ctx.log.error("user_save_failed", { err: message });
    return jsonApiError(500, ApiErrorCodes.DATABASE_ERROR, message, ctx.requestId);
  }
}
