import { randomUUID } from "crypto";
import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import { SharedScenario } from "@/models/SharedScenario";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { enforceWriteGuard } from "@/lib/api/guards";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";

const shareCreateSchema = z.object({
  scenarioName: z.string().trim().min(1).max(120),
  expiresInDays: z.union([z.literal(7), z.literal(30)]).optional(),
  snapshot: z.object({
    currentCost: z.number(),
    optimizedCost: z.number(),
    savings: z.number(),
    avoidableWaste: z.number(),
    members: z.number().int().min(0),
    subscriptions: z.number().int().min(0),
    suggestions: z.array(z.string()).max(8).default([]),
  }),
});

export async function postShare(req: Request, ctx: ApiContext) {
  const guardError = enforceWriteGuard(req, ctx, "share");
  if (guardError) return guardError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, ApiErrorCodes.INVALID_JSON, "Request body must be valid JSON.", ctx.requestId);
  }

  const parsed = shareCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "Request validation failed.", ctx.requestId, {
      zod: parsed.error.flatten(),
    });
  }

  try {
    await connectToDB();
    const shareId = randomUUID();
    const expiresInDays = parsed.data.expiresInDays ?? 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    await SharedScenario.create({
      shareId,
      scenarioName: parsed.data.scenarioName,
      snapshot: parsed.data.snapshot,
      expiresAt,
      revoked: false,
      viewCount: 0,
    });
    return jsonSuccess({ shareId, expiresAt, success: true }, ctx.requestId, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create share link";
    ctx.log.error("share_create_failed", { err: message });
    return jsonApiError(500, ApiErrorCodes.SHARE_CREATE_FAILED, message, ctx.requestId);
  }
}
