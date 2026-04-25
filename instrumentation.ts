import { logger } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  logger.info("instrumentation_ready", {
    runtime: process.env.NEXT_RUNTIME,
    telecomSyncMode: "external-job-only",
  });
}
