import { model, models, Schema } from "mongoose";
import { memberSchema } from "@/models/Member";
import { subscriptionSchema } from "@/models/Subscription";

const userSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ["individual", "family", "friends"],
      required: true,
    },
    city: { type: String, required: true },
    members: { type: [memberSchema], default: [] },
    subscriptions: { type: [subscriptionSchema], default: [] },
    wifi: {
      cost: { type: Number, default: 0 },
      usageType: { type: String, default: "moderate" },
    },
    income: { type: Number },
  },
  { timestamps: true }
);

export const User = models.User || model("User", userSchema);
