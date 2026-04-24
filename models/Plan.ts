import { Schema } from "mongoose";

export const planSchema = new Schema(
  {
    provider: { type: String, required: true },
    cost: { type: Number, required: true },
    validity: { type: String, required: true },
    dataPerDay: { type: String, required: true },
    usageType: { type: String, required: true },
  },
  { _id: false }
);
