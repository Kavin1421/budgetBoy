import { ACTUAL_USAGE_PER_DAY, DATA_PER_DAY } from "@/utils/constants";

/** Bill / pack daily data (from wizard enum). */
export function planDataPerDayToGB(value: (typeof DATA_PER_DAY)[number]): number {
  const map: Record<(typeof DATA_PER_DAY)[number], number> = {
    "No data": 0,
    "1GB": 1,
    "1.5GB": 1.5,
    "2GB": 2,
    "2.5GB": 2.5,
    "3GB": 3,
  };
  return map[value];
}

/** User-reported actual average daily usage. */
export function actualUsageToGB(value: (typeof ACTUAL_USAGE_PER_DAY)[number]): number {
  if (value === "No data") return 0;
  if (value === "0.5GB") return 0.5;
  if (value === "1GB") return 1;
  if (value === "1.5GB") return 1.5;
  if (value === "2GB+") return 2.5;
  return 0;
}
