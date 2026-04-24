import { Schema } from "mongoose";

export const subscriptionSchema = new Schema(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true },
    used: { type: Boolean, default: true },
  },
  { _id: false }
);
