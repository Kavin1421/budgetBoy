import { ApiErrorCodes } from "@/lib/api/errorCodes";
import type { ApiContext } from "@/lib/api/context";
import { jsonApiError } from "@/lib/api/responses";

type RateBucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, RateBucket>();

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "unknown";
}

function takeToken(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  memoryBuckets.set(key, bucket);
  return { ok: true, retryAfterSec: 0 };
}

export function enforceWriteGuard(
  req: Request,
  ctx: ApiContext,
  routeKey: "analyze" | "user" | "share"
) {
  const userAgent = req.headers.get("user-agent")?.trim();
  if (!userAgent) {
    return jsonApiError(400, ApiErrorCodes.BOT_BLOCKED, "Missing user-agent header.", ctx.requestId);
  }

  const contentType = req.headers.get("content-type")?.toLowerCase() ?? "";
  if (req.method === "POST" && !contentType.includes("application/json")) {
    return jsonApiError(400, ApiErrorCodes.VALIDATION_FAILED, "Content-Type must be application/json.", ctx.requestId);
  }

  const ip = getClientIp(req);
  const profile =
    routeKey === "analyze" ? { limit: 30, windowMs: 10 * 60 * 1000 } : routeKey === "user" ? { limit: 50, windowMs: 10 * 60 * 1000 } : { limit: 40, windowMs: 10 * 60 * 1000 };
  const token = takeToken(`${routeKey}:${ip}`, profile.limit, profile.windowMs);
  if (!token.ok) {
    ctx.log.warn("rate_limited", { routeKey, ip, retryAfterSec: token.retryAfterSec });
    return jsonApiError(429, ApiErrorCodes.RATE_LIMITED, "Too many requests. Please retry later.", ctx.requestId, {
      retryAfterSec: token.retryAfterSec,
    });
  }

  return null;
}
