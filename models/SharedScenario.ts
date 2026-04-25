import { model, models, Schema } from "mongoose";

const sharedScenarioSchema = new Schema(
  {
    shareId: { type: String, required: true, unique: true, index: true },
    scenarioName: { type: String, required: true },
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

export const SharedScenario = models.SharedScenario || model("SharedScenario", sharedScenarioSchema);
