import { PROVIDERS } from "@/utils/constants";

type Provider = (typeof PROVIDERS)[number];

/** City → provider perceived network quality (1–10) for Indian metros. */
export const CITY_NETWORK_SCORES: Record<string, Partial<Record<Provider, number>>> = {
  Bangalore: { Jio: 9, Airtel: 8, VI: 6, BSNL: 4 },
  Chennai: { Airtel: 9, Jio: 8, VI: 7, BSNL: 5 },
  Mumbai: { Jio: 9, Airtel: 8, VI: 7, BSNL: 4 },
  Delhi: { Airtel: 9, Jio: 8, VI: 6, BSNL: 5 },
  Hyderabad: { Airtel: 8, Jio: 9, VI: 6, BSNL: 4 },
  Kolkata: { Jio: 8, Airtel: 8, VI: 7, BSNL: 5 },
  Pune: { Jio: 8, Airtel: 9, VI: 6, BSNL: 4 },
  Ahmedabad: { Jio: 8, Airtel: 8, VI: 6, BSNL: 5 },
  Other: { Jio: 8, Airtel: 8, VI: 6, BSNL: 5 },
};

export function getNetworkQuality(city: string, provider: string): number {
  const row = CITY_NETWORK_SCORES[city] ?? CITY_NETWORK_SCORES.Other;
  const p = provider as Provider;
  const v = row[p];
  return typeof v === "number" ? v : 6;
}
