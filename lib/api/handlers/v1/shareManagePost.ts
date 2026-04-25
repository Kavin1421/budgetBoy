import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import { SharedScenario } from "@/models/SharedScenario";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { enforceWriteGuard } from "@/lib/api/guards";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";

const shareManageSchema = z.object({
  shareIds: z.array(z.string().uuid()).min(1).max(100),
});

export async function postShareManage(req: Request, ctx: ApiContext) {
  const guardError = enforceWriteGuard(req, ctx, "share");
  if (guardError) return guardError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, ApiErrorCodes.INVALID_JSON, "Request body must be valid JSON.", ctx.requestId);
  }

  const parsed = shareManageSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "Request validation failed.", ctx.requestId, {
      zod: parsed.error.flatten(),
    });
  }

  try {
    await connectToDB();
    const docs = await SharedScenario.find({ shareId: { $in: parsed.data.shareIds } })
      .sort({ createdAt: -1 })
      .lean<{
        shareId: string;
        scenarioName: string;
        createdAt: Date;
        expiresAt: Date;
        revoked?: boolean;
        revokedAt?: Date | null;
        viewCount?: number;
        lastViewedAt?: Date | null;
      }[]>();

    return jsonSuccess(
      {
        shares: docs.map((doc) => ({
          shareId: doc.shareId,
          scenarioName: doc.scenarioName,
          createdAt: doc.createdAt,
          expiresAt: doc.expiresAt,
          revoked: Boolean(doc.revoked),
          revokedAt: doc.revokedAt ?? null,
          viewCount: doc.viewCount ?? 0,
          lastViewedAt: doc.lastViewedAt ?? null,
        })),
      },
      ctx.requestId
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load share links";
    return jsonApiError(500, ApiErrorCodes.DATABASE_ERROR, message, ctx.requestId);
  }
}
