export const PROVIDERS = ["Jio", "Airtel", "VI", "BSNL"] as const;

/** WiFi / home usage profile (unchanged semantics). */
export const WIFI_USAGE_TYPES = ["light", "moderate", "heavy", "work-from-home"] as const;

/** Validity buckets seen in collected telecom catalog data. */
export const VALIDITIES = [
  "1",
  "2",
  "3",
  "7",
  "10",
  "14",
  "18",
  "24",
  "28",
  "30",
  "31",
  "45",
  "50",
  "54",
  "56",
  "60",
  "75",
  "77",
  "80",
  "84",
  "90",
  "98",
  "100",
  "110",
  "120",
  "130",
  "160",
  "180",
  "200",
  "215",
  "300",
  "336",
  "365",
] as const;

/** Pack allowance shown on bill (per day). */
export const DATA_PER_DAY = ["No data", "1GB", "1.5GB", "2GB", "2.5GB", "3GB"] as const;

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

/** Member-scoped advanced tuning knobs for recommendation confidence. */
export const RECHARGE_FRICTION_PREFERENCES = ["low", "medium", "high"] as const;
export const DATA_ROLLOVER_RISK_WINDOWS = ["never", "1-3", "4-8", "often"] as const;
export const CALL_QUALITY_SENSITIVITY = ["low", "medium", "high"] as const;
export const BILL_SHOCK_TOLERANCE = ["yes", "no"] as const;

/** Billing frequency for subscriptions. */
export const SUBSCRIPTION_BILLING_CYCLES = ["monthly", "yearly"] as const;

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
