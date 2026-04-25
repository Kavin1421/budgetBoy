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
    rechargeIntent: { type: String, required: true, default: "both-balanced" },
    priority: { type: String, required: true, default: "balanced" },
    callingNeed: { type: String, required: true, default: "regular" },
    needsOtt: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);
