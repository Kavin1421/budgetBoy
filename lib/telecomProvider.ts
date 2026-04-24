import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CatalogTelecomPlan, TelecomProviderFile } from "@/lib/telecomTypes";
import { telecomFileSchema } from "@/utils/telecomValidators";

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; plans: CatalogTelecomPlan[] }>();

function providerSlug(provider: string): string {
  const map: Record<string, string> = { Jio: "jio", Airtel: "airtel", VI: "vi", BSNL: "bsnl" };
  return map[provider] ?? provider.toLowerCase().replace(/\s+/g, "");
}

function normalizePlans(raw: unknown, fallbackProvider: string): CatalogTelecomPlan[] {
  if (Array.isArray(raw)) {
    const wrapped: TelecomProviderFile = { provider: fallbackProvider, plans: raw as CatalogTelecomPlan[] };
    const parsed = telecomFileSchema.safeParse(wrapped);
    return parsed.success ? parsed.data.plans.map((p) => normalizeOne(p, parsed.data.provider)) : [];
  }
  const obj = raw as Partial<TelecomProviderFile>;
  const plans = obj.plans ?? (obj as { data?: CatalogTelecomPlan[] }).data;
  const provider = obj.provider ?? fallbackProvider;
  const parsed = telecomFileSchema.safeParse({ provider, plans: plans ?? [] });
  return parsed.success ? parsed.data.plans.map((p) => normalizeOne(p, parsed.data.provider)) : [];
}

function normalizeOne(p: Omit<CatalogTelecomPlan, "provider"> & { provider?: string }, provider: string): CatalogTelecomPlan {
  return {
    ...p,
    provider: p.provider ?? provider,
    lastUpdated: typeof p.lastUpdated === "string" ? p.lastUpdated : new Date(p.lastUpdated as unknown as Date).toISOString().slice(0, 10),
  };
}

async function loadLocalJson(provider: string): Promise<CatalogTelecomPlan[]> {
  const slug = providerSlug(provider);
  const filePath = path.join(process.cwd(), "data", "telecom", `${slug}.json`);
  const buf = await readFile(filePath, "utf8");
  const json = JSON.parse(buf) as unknown;
  const parsed = telecomFileSchema.safeParse(json);
  if (!parsed.success) return [];
  return parsed.data.plans.map((plan) => ({ ...plan, provider: parsed.data.provider }));
}

async function fetchFromApi(provider: string): Promise<CatalogTelecomPlan[]> {
  const base = process.env.TELECOM_API_URL;
  const key = process.env.TELECOM_API_KEY;
  if (!base) {
    return loadLocalJson(provider);
  }
  const url = new URL(base.replace(/\/$/, "") + "/plans");
  url.searchParams.set("provider", provider);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (key) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) return loadLocalJson(provider);
  const body = (await res.json()) as unknown;
  return normalizePlans(body, provider);
}

/**
 * Unified entry: API when USE_TELECOM_API=true, else local JSON.
 * In-memory cache to avoid repeated disk/API hits.
 */
export async function getTelecomPlans(provider: string): Promise<CatalogTelecomPlan[]> {
  const useApi = process.env.USE_TELECOM_API === "true";
  const key = `${useApi ? "api" : "local"}:${provider}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.plans;

  const plans = useApi ? await fetchFromApi(provider) : await loadLocalJson(provider);
  cache.set(key, { at: Date.now(), plans });
  return plans;
}

export function invalidateTelecomPlanCache(provider?: string) {
  if (!provider) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k.endsWith(`:${provider}`)) cache.delete(k);
  }
}
