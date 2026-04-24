import { model, models, Schema } from "mongoose";

const telecomCatalogPlanSchema = new Schema(
  {
    provider: { type: String, required: true, index: true },
    planId: { type: String, required: true, unique: true },
    price: { type: Number, required: true, index: true },
    validityDays: { type: Number, required: true },
    dataPerDayGB: { type: Number, required: true, index: true },
    totalDataGB: { type: Number, required: true },
    calls: { type: String, required: true },
    smsPerDay: { type: Number, required: true },
    ottBenefits: { type: [String], default: [] },
    category: { type: String, required: true },
    lastUpdated: { type: Date, required: true },
  },
  { collection: "telecom_plans" }
);

telecomCatalogPlanSchema.index({ provider: 1, price: 1 });
telecomCatalogPlanSchema.index({ provider: 1, dataPerDayGB: 1 });

export const TelecomCatalogPlan =
  models.TelecomCatalogPlan || model("TelecomCatalogPlan", telecomCatalogPlanSchema);
