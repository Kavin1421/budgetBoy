import { model, models, Schema } from "mongoose";

const sharedScenarioSchema = new Schema(
  {
    shareId: { type: String, required: true, unique: true, index: true },
    scenarioName: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false, index: true },
    revokedAt: { type: Date, default: null },
    viewCount: { type: Number, default: 0 },
    lastViewedAt: { type: Date, default: null },
    snapshot: {
      currentCost: { type: Number, required: true },
      optimizedCost: { type: Number, required: true },
      savings: { type: Number, required: true },
      avoidableWaste: { type: Number, required: true },
      members: { type: Number, required: true },
      subscriptions: { type: Number, required: true },
      suggestions: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

sharedScenarioSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SharedScenario = models.SharedScenario || model("SharedScenario", sharedScenarioSchema);
