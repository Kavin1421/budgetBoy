/** Normalized catalog plan used across provider, DB, and UI */
export type CatalogTelecomPlan = {
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
  lastUpdated: string;
};

export type TelecomProviderFile = {
  provider: string;
  plans: CatalogTelecomPlan[];
};
