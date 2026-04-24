import { logger } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.USE_TELECOM_API === "true") return;
  if (!process.env.MONGO_URL) return;

  try {
    const { syncTelecomPlans } = await import("./lib/telecomSync");
    const result = await syncTelecomPlans({ removeDeprecated: false });
    logger.info("instrumentation_telecom_sync", {
      filesProcessed: result.filesProcessed,
      upserted: result.upserted,
      errors: result.errors.length,
    });
  } catch (e) {
    logger.error("instrumentation_telecom_sync_failed", {
      err: e instanceof Error ? e.message : String(e),
    });
  }
}
