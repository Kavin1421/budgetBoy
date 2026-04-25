import { connectToDB } from "@/lib/mongodb";
import { SharedScenario } from "@/models/SharedScenario";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";

export async function getShareById(shareId: string, ctx: ApiContext) {
  const normalizedShareId = (shareId ?? "").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? "";
  if (!normalizedShareId) {
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "shareId is required.", ctx.requestId);
  }

  try {
    await connectToDB();
    const doc = await SharedScenario.findOne({ shareId: normalizedShareId }).lean();
    if (!doc) {
      return jsonApiError(404, ApiErrorCodes.SHARE_NOT_FOUND, "Shared scenario was not found.", ctx.requestId);
    }

    return jsonSuccess(
      {
        shareId: doc.shareId,
        scenarioName: doc.scenarioName,
        snapshot: doc.snapshot,
        createdAt: doc.createdAt,
      },
      ctx.requestId
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to read shared scenario";
    return jsonApiError(500, ApiErrorCodes.DATABASE_ERROR, message, ctx.requestId);
  }
}
