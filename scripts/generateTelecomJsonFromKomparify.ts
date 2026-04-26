/**
 * Fetches prepaid plan tables from Komparify (aggregator), dedupes by pack id across
 * all regions on the page, and writes `data/telecom/{jio,airtel,vi,bsnl}.json`.
 *
 * Run: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"CommonJS"}' scripts/generateTelecomJsonFromKomparify.ts
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { validateTelecomFile } from "../utils/telecomValidators";
import { manualPlansFor } from "./telecomCatalogManual";

type Row = {
  packId: string;
  price: number;
  validityDays: number;
  benefits: string;
};

const KOMPARIFY = {
  Jio: "https://www.komparify.com/operators/31-reliance-jio/type/prepaid-plans",
  Airtel: "https://www.komparify.com/operators/1-bharti-airtel/type/prepaid-plans",
  VI: "https://www.komparify.com/operators/499-vodafone-idea/type/prepaid-plans",
  BSNL: "https://www.komparify.com/operators/6-bsnl/type/prepaid-plans",
} as const;

const PROVIDER_JSON: Record<keyof typeof KOMPARIFY, string> = {
  Jio: "Jio",
  Airtel: "Airtel",
  VI: "VI",
  BSNL: "BSNL",
};

const PLAN_PREFIX: Record<keyof typeof KOMPARIFY, string> = {
  Jio: "JIO",
  Airtel: "AIRTEL",
  VI: "VI",
  BSNL: "BSNL",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function parseValidityDays(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (/\b1\s*year\b/.test(t) || /\b365\s*days?\b/.test(t)) return 365;
  const mMo = t.match(/(\d+)\s*months?/);
  if (mMo) return Number(mMo[1]) * 30;
  if (/\b1\s*month\b/.test(t)) return 30;
  const mDay = t.match(/(\d+)\s*days?/);
  if (mDay) return Number(mDay[1]);
  if (/\b1\s*day\b/.test(t)) return 1;
  if (t.includes("existing")) return null;
  return null;
}

function extractRows(html: string): Row[] {
  const byId = new Map<string, Row>();
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html))) {
    const tr = m[1];
    if (!tr.includes("plantopups/") || !tr.includes("currencyrupie")) continue;
    const idm = tr.match(/plantopups\/(\d+)/);
    const priceM = tr.match(/currencyrupie">₹<\/span>\s*([0-9.]+)/);
    const valM = tr.match(/currencyrupie([\s\S]*?)<\/td>\s*<td>([^<]+)<\/td>/);
    const benM = tr.match(/class="nounderlinedescriptionlink">([\s\S]*?)<\/a>/);
    if (!idm || !priceM || !valM || !benM) continue;
    const packId = idm[1];
    if (byId.has(packId)) continue;
    const price = Math.round(Number(priceM[1]));
    const validityDays = parseValidityDays(valM[2]);
    if (!validityDays || validityDays <= 0 || !Number.isFinite(price) || price <= 0) continue;
    const benefits = decodeEntities(benM[1].replace(/<[^>]+>/g, " "));
    byId.set(packId, { packId, price, validityDays, benefits });
  }
  return [...byId.values()];
}

function parseCalls(b: string): string {
  if (/Voice:\s*NA|No Voice|No outgoing voice/i.test(b)) return "NA";
  if (/Unlimited Calls|Unlimited call|Unlimited Voice|Voice:\s*Unlimited|free voice calling|Unlimited free voice/i.test(b))
    return "Unlimited";
  return "See plan";
}

function parseSmsPerDay(b: string, validityDays: number): number {
  const m100 = b.match(/100\s*SMS\/day|100\s*SMS\s*per\s*day|100\s*SMS\/Day|100\s*SMS\/day/i);
  if (m100) return 100;
  const mDay = b.match(/(\d+)\s*SMS\/day/i);
  if (mDay) return Math.min(100, Number(mDay[1]));
  const mSlash = b.match(/(\d+)\s*\/\s*day.*SMS|SMS:\s*(\d+)\s*\/\s*day/i);
  if (mSlash) return Math.min(100, Number(mSlash[1] || mSlash[2]));
  const total = b.match(/(\d+)\s*SMS\b(?!\/day)/i);
  if (total && validityDays > 0) {
    const n = Number(total[1]);
    if (n >= 3000) return Math.min(100, Math.ceil(n / validityDays));
  }
  if (/SMS:\s*NA|No SMS|No Outgoing SMS/i.test(b)) return 0;
  return 0;
}

function parseDataMetrics(
  b: string,
  validityDays: number
): { dataPerDayGB: number; totalDataGB: number; unlimitedProxy: boolean } {
  if (/full day unlimited|unlimited data,\s*everyday|unlimited combo|get full day unlimited/i.test(b)) {
    const proxy = 99;
    return { dataPerDayGB: proxy, totalDataGB: proxy * validityDays, unlimitedProxy: true };
  }
  if (/\bdata:\s*unlimited\b/i.test(b)) {
    const proxy = 99;
    return { dataPerDayGB: proxy, totalDataGB: proxy * validityDays, unlimitedProxy: true };
  }
  if (/\bdata:\s*na\b/i.test(b)) {
    return { dataPerDayGB: 0, totalDataGB: 0, unlimitedProxy: false };
  }

  const dayBonus = b.match(/Data:\s*([\d.]+)\s*GB\s*\/\s*day\s*\+\s*([\d.]+)\s*GB/i);
  if (dayBonus) {
    const dpd = Number(dayBonus[1]);
    const bonus = Number(dayBonus[2]);
    return { dataPerDayGB: dpd, totalDataGB: dpd * validityDays + bonus, unlimitedProxy: false };
  }

  const dayOnly =
    b.match(/Data:\s*([\d.]+)\s*GB\s*\/\s*day/i) ||
    b.match(/Data:\s*([\d.]+)\s*GB\/day/i) ||
    b.match(/([\d.]+)\s*GB\s*\/\s*day(?!.*thereafter)/i);
  if (dayOnly) {
    const dpd = Number(dayOnly[1]);
    return { dataPerDayGB: dpd, totalDataGB: dpd * validityDays, unlimitedProxy: false };
  }

  const thereafter = b.match(/Data:\s*([\d.]+)\s*GB\s*\/\s*day\s*thereafter/i);
  if (thereafter) {
    const dpd = Number(thereafter[1]);
    return { dataPerDayGB: dpd, totalDataGB: dpd * validityDays, unlimitedProxy: false };
  }

  const bucket =
    b.match(/Data:\s*([\d.]+)\s*GB\s*\|/i) ||
    b.match(/Data:\s*([\d.]+)GB\b/i) ||
    b.match(/Get\s+([\d.]+)\s*GB\s+Data/i) ||
    b.match(/Get\s+([\d.]+)GB\s+Data/i);
  if (bucket) {
    const total = Number(bucket[1]);
    const dpd = Math.round((total / validityDays) * 10000) / 10000;
    return { dataPerDayGB: dpd, totalDataGB: total, unlimitedProxy: false };
  }

  const gbTotal = b.match(/(\d+(?:\.\d+)?)\s*GB\s*\(total\)/i);
  if (gbTotal) {
    const total = Number(gbTotal[1]);
    const dpd = Math.round((total / validityDays) * 10000) / 10000;
    return { dataPerDayGB: dpd, totalDataGB: total, unlimitedProxy: false };
  }

  return { dataPerDayGB: 0, totalDataGB: 0, unlimitedProxy: false };
}

function extractOtt(b: string): string[] {
  const out: string[] = [];
  const keys = [
    "JioHotstar",
    "Hotstar",
    "Netflix",
    "Prime",
    "Amazon Prime",
    "Disney",
    "Sony LIV",
    "Gemini",
    "JioTV",
    "JioCinema",
    "JioAICloud",
    "Vi Movies",
    "Wynk",
    "Xstream",
    "Sun NXT",
    "Lionsgate",
    "Apple Music",
  ];
  for (const k of keys) {
    if (b.includes(k) && !out.includes(k)) out.push(k);
  }
  return out;
}

function categoryFor(row: Row, calls: string, dpd: number, unlimitedProxy: boolean): string {
  if (row.validityDays >= 300) return "yearly";
  if (row.validityDays <= 3) return "short-validity";
  if (calls === "NA" && dpd === 0 && !unlimitedProxy) return "data-or-addon";
  if (unlimitedProxy) return "unlimited-daily";
  if (dpd >= 3) return "heavy";
  if (dpd >= 2) return "mid-range";
  if (dpd >= 1) return "popular";
  return "prepaid";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BudgetBoyTelecomCatalog/1.0 (+https://github.com) node" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function buildFile(operator: keyof typeof KOMPARIFY): Promise<void> {
  const html = await fetchHtml(KOMPARIFY[operator]);
  const rows = extractRows(html);
  const prefix = PLAN_PREFIX[operator];
  const provider = PROVIDER_JSON[operator];
  const lastUpdated = today();

  const scraped = rows.map((row) => {
    const { dataPerDayGB, totalDataGB, unlimitedProxy } = parseDataMetrics(row.benefits, row.validityDays);
    const calls = parseCalls(row.benefits);
    const smsPerDay = parseSmsPerDay(row.benefits, row.validityDays);
    const ottBenefits = extractOtt(row.benefits);
    const category = categoryFor(row, calls, dataPerDayGB, unlimitedProxy);
    const totalRounded = Math.round(totalDataGB * 100) / 100;
    return {
      planId: `${prefix}_${row.packId}`,
      price: row.price,
      validityDays: row.validityDays,
      dataPerDayGB,
      totalDataGB: totalRounded,
      calls,
      smsPerDay,
      ottBenefits,
      category,
      lastUpdated,
    };
  });

  const manual = manualPlansFor(operator, lastUpdated, prefix);
  const byId = new Map<string, (typeof scraped)[0]>();
  for (const p of [...scraped, ...manual]) {
    if (!byId.has(p.planId)) byId.set(p.planId, p);
  }
  const plans = [...byId.values()].sort((a, b) => a.price - b.price || a.validityDays - b.validityDays);

  const payload = { provider, plans };
  const validated = validateTelecomFile(payload);
  if (!validated.ok) throw new Error(`${operator}: ${validated.error}`);
  const outPath = path.join(process.cwd(), "data", "telecom", `${operator === "VI" ? "vi" : operator.toLowerCase()}.json`);
  await writeFile(outPath, JSON.stringify(validated.data, null, 2) + "\n", "utf8");
  console.log(`${provider}: wrote ${plans.length} plans -> ${outPath}`);
}

async function main() {
  for (const op of Object.keys(KOMPARIFY) as (keyof typeof KOMPARIFY)[]) {
    await buildFile(op);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
