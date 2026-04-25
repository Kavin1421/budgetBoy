import { model, models, Schema } from "mongoose";

const recommendationFeedbackSchema = new Schema(
  {
    provider: { type: String, required: true, enum: ["Jio", "Airtel", "VI", "BSNL"] },
    recommendedPlanId: { type: String, required: false, default: null },
    action: { type: String, required: true, enum: ["accepted_switch", "dismissed_switch", "kept_current"] },
    city: { type: String, required: false, default: null },
    memberName: { type: String, required: false, default: null },
  },
  { timestamps: true }
);

recommendationFeedbackSchema.index({ provider: 1, recommendedPlanId: 1, createdAt: -1 });

export const RecommendationFeedback =
  models.RecommendationFeedback || model("RecommendationFeedback", recommendationFeedbackSchema);
