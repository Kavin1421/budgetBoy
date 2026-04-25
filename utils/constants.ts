export const PROVIDERS = ["Jio", "Airtel", "VI", "BSNL"] as const;

/** WiFi / home usage profile (unchanged semantics). */
export const WIFI_USAGE_TYPES = ["light", "moderate", "heavy", "work-from-home"] as const;

export const VALIDITIES = ["28", "56", "84", "365"] as const;

/** Pack allowance shown on bill (per day). */
export const DATA_PER_DAY = ["No data", "1GB", "1.5GB", "2GB", "3GB"] as const;

/** Actual average mobile data used per day. */
export const ACTUAL_USAGE_PER_DAY = ["No data", "0.5GB", "1GB", "1.5GB", "2GB+"] as const;

/** Per-member line usage (calls vs data-heavy). */
export const MEMBER_LINE_USAGE = ["calls-only", "light", "medium", "heavy"] as const;

/** Mandatory intent for each line so recommendation can optimize for human need, not only GB math. */
export const MEMBER_RECHARGE_INTENTS = [
  "calls-only",
  "data-only",
  "both-balanced",
  "streaming-heavy",
  "senior-basic",
  "work-business",
] as const;

/** Preference weight while ranking plans. */
export const MEMBER_PRIORITIES = ["lowest-cost", "best-network", "balanced"] as const;

/** Approx daily call need bucket. */
export const CALLING_NEEDS = ["rare", "regular", "high", "unlimited-needed"] as const;

export const INDIAN_CITIES = [
  "Bangalore",
  "Chennai",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Other",
] as const;
