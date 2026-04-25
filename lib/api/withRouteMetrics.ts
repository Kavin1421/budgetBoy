import type { ApiContext } from "@/lib/api/context";

export async function withRouteMetrics<T>(
  ctx: ApiContext,
  method: string,
  handler: () => Promise<T>
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await handler();
    ctx.log.info("request_complete", {
      method,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    ctx.log.error("request_failed", {
      method,
      durationMs: Date.now() - startedAt,
      err: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
