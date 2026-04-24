import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "@/lib/logger";
import { connectToDB } from "@/lib/mongodb";
import type { CatalogTelecomPlan } from "@/lib/telecomTypes";
import { TelecomCatalogPlan } from "@/models/TelecomCatalogPlan";
import { validateTelecomFile } from "@/utils/telecomValidators";
import { invalidateTelecomPlanCache } from "@/lib/telecomProvider";
import { invalidateCatalogCache } from "@/lib/dbTelecomPlans";

const TELECOM_DIR = path.join(process.cwd(), "data", "telecom");

export type SyncResult = {
  filesProcessed: number;
  upserted: number;
  removedDeprecated: number;
  errors: string[];
};

function toDoc(p: CatalogTelecomPlan, fileProvider: string) {
  return {
    provider: fileProvider,
    planId: p.planId,
    price: p.price,
    validityDays: p.validityDays,
    dataPerDayGB: p.dataPerDayGB,
    totalDataGB: p.totalDataGB,
    calls: p.calls,
    smsPerDay: p.smsPerDay,
    ottBenefits: p.ottBenefits,
    category: p.category,
    lastUpdated: new Date(p.lastUpdated),
  };
}

/**
 * Read all JSON files under data/telecom, validate, upsert by planId.
 * Optionally removes DB rows for a provider when that provider's file no longer lists a planId.
 */
export async function syncTelecomPlans(options?: { removeDeprecated?: boolean }): Promise<SyncResult> {
  const removeDeprecated = options?.removeDeprecated ?? false;
  const errors: string[] = [];
  let upserted = 0;
  let filesProcessed = 0;
  let removedDeprecated = 0;

  await connectToDB();

  const entries = await readdir(TELECOM_DIR).catch(() => [] as string[]);
  const jsonFiles = entries.filter((f) => f.endsWith(".json"));

  const activeByProvider = new Map<string, Set<string>>();

  for (const file of jsonFiles) {
    filesProcessed += 1;
    const full = path.join(TELECOM_DIR, file);
    let raw: unknown;
    try {
      raw = JSON.parse(await readFile(full, "utf8"));
    } catch (e) {
      errors.push(`${file}: ${e instanceof Error ? e.message : "parse error"}`);
      continue;
    }

    const validated = validateTelecomFile(raw);
    if (!validated.ok) {
      errors.push(`${file}: ${validated.error}`);
      continue;
    }

    const { provider, plans } = validated.data;
    const ids = new Set<string>();
    for (const p of plans) {
      ids.add(p.planId);
      const doc = toDoc({ ...p, provider }, provider);
      await TelecomCatalogPlan.updateOne(
        { planId: doc.planId },
        { $set: doc },
        { upsert: true }
      );
      upserted += 1;
    }
    activeByProvider.set(provider, ids);
  }

  if (removeDeprecated) {
    for (const [provider, ids] of activeByProvider) {
      const res = await TelecomCatalogPlan.deleteMany({
        provider,
        planId: { $nin: [...ids] },
      });
      removedDeprecated += res.deletedCount ?? 0;
    }
  }

  invalidateTelecomPlanCache();
  invalidateCatalogCache();
  logger.info("telecom_sync_complete", {
    filesProcessed,
    upserted,
    removedDeprecated,
    errorCount: errors.length,
  });
  if (errors.length) {
    logger.warn("telecom_sync_file_errors", { errors });
  }
  return { filesProcessed, upserted, removedDeprecated, errors };
}
