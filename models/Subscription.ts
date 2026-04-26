import { Schema } from "mongoose";

export const subscriptionSchema = new Schema(
  {
    schemaVersion: { type: Number, required: true, default: 1, min: 1 },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    cost: { type: Number, required: true, min: 0, max: 50000 },
    billingCycle: { type: String, required: true, enum: ["monthly", "yearly"], default: "monthly" },
    used: { type: Boolean, default: true },
  },
  { _id: false }
);
