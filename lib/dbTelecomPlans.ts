import { connectToDB } from "@/lib/mongodb";
import type { CatalogTelecomPlan } from "@/lib/telecomTypes";
import { TelecomCatalogPlan } from "@/models/TelecomCatalogPlan";

const CACHE_TTL_MS = 2 * 60 * 1000;
let cache: { key: string; at: number; plans: CatalogTelecomPlan[] } | null = null;

function leanToCatalog(doc: {
  provider: string;
  planId: string;
  price: number;
  validityDays: number;
  dataPerDayGB: number;
  totalDataGB: number;
  calls: string;
  smsPerDay: number;
  ottBenefits: string[];
  category: string;
  lastUpdated: Date;
}): CatalogTelecomPlan {
  return {
    provider: doc.provider,
    planId: doc.planId,
    price: doc.price,
    validityDays: doc.validityDays,
    dataPerDayGB: doc.dataPerDayGB,
    totalDataGB: doc.totalDataGB,
    calls: doc.calls,
    smsPerDay: doc.smsPerDay,
    ottBenefits: doc.ottBenefits ?? [],
    category: doc.category,
    lastUpdated: doc.lastUpdated.toISOString().slice(0, 10),
  };
}

/** Load catalog plans from Mongo for given providers (empty = all). */
export async function getCatalogPlansFromDb(providers?: string[]): Promise<CatalogTelecomPlan[]> {
  await connectToDB();
  const filter = providers?.length ? { provider: { $in: providers } } : {};
  const docs = await TelecomCatalogPlan.find(filter).lean().exec();
  return docs.map((d) =>
    leanToCatalog({
      provider: d.provider,
      planId: d.planId,
      price: d.price,
      validityDays: d.validityDays,
      dataPerDayGB: d.dataPerDayGB,
      totalDataGB: d.totalDataGB,
      calls: d.calls,
      smsPerDay: d.smsPerDay,
      ottBenefits: d.ottBenefits ?? [],
      category: d.category,
      lastUpdated: d.lastUpdated instanceof Date ? d.lastUpdated : new Date(d.lastUpdated),
    })
  );
}

/** Cached catalog reads to avoid repeated Mongo hits during analysis. */
export async function getCatalogPlansFromDbCached(providers?: string[]): Promise<CatalogTelecomPlan[]> {
  const key = providers?.length ? [...new Set(providers)].sort().join("|") : "__ALL__";
  if (cache && cache.key === key && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.plans;
  }
  const plans = await getCatalogPlansFromDb(providers?.length ? providers : undefined);
  cache = { key, at: Date.now(), plans };
  return plans;
}

export function invalidateCatalogCache() {
  cache = null;
}
