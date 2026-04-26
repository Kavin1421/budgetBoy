import { Schema } from "mongoose";

/** Embedded member + current mobile line (per-person optimization input). */
export const memberSchema = new Schema(
  {
    schemaVersion: { type: Number, required: true, default: 1, min: 1 },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    provider: { type: String, required: true, enum: ["Jio", "Airtel", "VI", "BSNL"] },
    currentPlanPrice: { type: Number, required: true, min: 0, max: 50000 },
    validity: {
      type: String,
      required: true,
      enum: ["1", "2", "3", "7", "10", "14", "18", "24", "28", "30", "31", "45", "50", "54", "56", "60", "75", "77", "80", "84", "90", "98", "100", "110", "120", "130", "160", "180", "200", "215", "300", "336", "365"],
    },
    planDataPerDay: { type: String, required: true, enum: ["No data", "1GB", "1.5GB", "2GB", "2.5GB", "3GB"] },
    actualUsagePerDay: { type: String, required: true, enum: ["No data", "0.5GB", "1GB", "1.5GB", "2GB+"] },
    lineUsageType: { type: String, required: true, enum: ["calls-only", "light", "medium", "heavy"] },
    rechargeIntent: {
      type: String,
      required: true,
      enum: ["calls-only", "data-only", "both-balanced", "streaming-heavy", "senior-basic", "work-business"],
      default: "both-balanced",
    },
    priority: { type: String, required: true, enum: ["lowest-cost", "best-network", "balanced"], default: "balanced" },
    callingNeed: { type: String, required: true, enum: ["rare", "regular", "high", "unlimited-needed"], default: "regular" },
    needsOtt: { type: Boolean, required: true, default: false },
    networkConfidence: { type: Number, required: true, min: 1, max: 5, default: 3 },
    rechargeFrictionPreference: { type: String, required: true, enum: ["low", "medium", "high"], default: "medium" },
    dataRolloverRiskWindow: { type: String, required: true, enum: ["never", "1-3", "4-8", "often"], default: "1-3" },
    hotspotNeeded: { type: Boolean, required: true, default: false },
    callQualitySensitivity: { type: String, required: true, enum: ["low", "medium", "high"], default: "medium" },
    billShockTolerance: { type: String, required: true, enum: ["yes", "no"], default: "yes" },
  },
  { _id: false }
);
