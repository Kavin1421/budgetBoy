import { connectToDB } from "@/lib/mongodb";
import { SharedScenario } from "@/models/SharedScenario";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { enforceWriteGuard } from "@/lib/api/guards";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";

export async function postShareRevoke(req: Request, shareId: string, ctx: ApiContext) {
  const guardError = enforceWriteGuard(req, ctx, "share");
  if (guardError) return guardError;

  const normalizedShareId = (shareId ?? "").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? "";
  if (!normalizedShareId) {
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "shareId is required.", ctx.requestId);
  }

  try {
    await connectToDB();
    const now = new Date();
    const doc = await SharedScenario.findOneAndUpdate(
      { shareId: normalizedShareId, revoked: { $ne: true } },
      { $set: { revoked: true, revokedAt: now } },
      { new: true }
    ).lean();
    if (!doc) {
      return jsonApiError(404, ApiErrorCodes.SHARE_NOT_FOUND, "Shared scenario was not found.", ctx.requestId);
    }
    return jsonSuccess({ shareId: normalizedShareId, revoked: true, revokedAt: now }, ctx.requestId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to revoke shared scenario";
    return jsonApiError(500, ApiErrorCodes.DATABASE_ERROR, message, ctx.requestId);
  }
}
