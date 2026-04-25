import { model, models, Schema } from "mongoose";
import { memberSchema } from "@/models/Member";
import { subscriptionSchema } from "@/models/Subscription";

const userSchema = new Schema(
  {
    schemaVersion: { type: Number, required: true, default: 1, min: 1 },
    mode: {
      type: String,
      enum: ["individual", "family", "friends"],
      required: true,
    },
    city: {
      type: String,
      required: true,
      enum: ["Bangalore", "Chennai", "Mumbai", "Delhi", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Other"],
    },
    members: { type: [memberSchema], default: [] },
    subscriptions: { type: [subscriptionSchema], default: [] },
    wifi: {
      cost: { type: Number, default: 0, min: 0, max: 50000 },
      usageType: { type: String, default: "moderate", enum: ["light", "moderate", "heavy", "work-from-home"] },
    },
    income: { type: Number, min: 0, max: 10000000 },
  },
  { timestamps: true }
);

export const User = models.User || model("User", userSchema);
