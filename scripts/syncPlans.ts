import path from "node:path";
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";
import { logger } from "../lib/logger";

loadEnv({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
loadEnv({ quiet: true });

async function main() {
  const { syncTelecomPlans } = await import("../lib/telecomSync");
  const result = await syncTelecomPlans({
    removeDeprecated: process.env.TELECOM_SYNC_PRUNE === "true",
  });
  logger.info("sync_plans_cli", result);
}

main()
  .catch((e) => {
    logger.error("sync_plans_cli_failed", { err: e instanceof Error ? e.message : String(e) });
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
