import { Schema } from "mongoose";

/** Embedded member + current mobile line (per-person optimization input). */
export const memberSchema = new Schema(
  {
    name: { type: String, required: true },
    provider: { type: String, required: true },
    currentPlanPrice: { type: Number, required: true },
    validity: { type: String, required: true },
    planDataPerDay: { type: String, required: true },
    actualUsagePerDay: { type: String, required: true },
    lineUsageType: { type: String, required: true },
  },
  { _id: false }
);
