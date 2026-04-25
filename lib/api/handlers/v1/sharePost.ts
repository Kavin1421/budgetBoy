import { randomUUID } from "crypto";
import { z } from "zod";
import { connectToDB } from "@/lib/mongodb";
import { SharedScenario } from "@/models/SharedScenario";
import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { jsonApiError, jsonSuccess } from "@/lib/api/responses";

const shareCreateSchema = z.object({
  scenarioName: z.string().trim().min(1).max(120),
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
    await SharedScenario.create({
      shareId,
      scenarioName: parsed.data.scenarioName,
      snapshot: parsed.data.snapshot,
    });
    return jsonSuccess({ shareId, success: true }, ctx.requestId, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create share link";
    ctx.log.error("share_create_failed", { err: message });
    return jsonApiError(500, ApiErrorCodes.SHARE_CREATE_FAILED, message, ctx.requestId);
  }
}
