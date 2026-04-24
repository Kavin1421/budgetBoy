export const PROVIDERS = ["Jio", "Airtel", "VI", "BSNL"] as const;

/** WiFi / home usage profile (unchanged semantics). */
export const WIFI_USAGE_TYPES = ["light", "moderate", "heavy", "work-from-home"] as const;

export const VALIDITIES = ["28", "56", "84", "365"] as const;

/** Pack allowance shown on bill (per day). */
export const DATA_PER_DAY = ["1GB", "1.5GB", "2GB", "3GB"] as const;

/** Actual average mobile data used per day. */
export const ACTUAL_USAGE_PER_DAY = ["0.5GB", "1GB", "1.5GB", "2GB+"] as const;

/** Per-member line usage (calls vs data-heavy). */
export const MEMBER_LINE_USAGE = ["calls-only", "light", "medium", "heavy"] as const;

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
