import mongoose from "mongoose";
import { logger } from "@/lib/logger";

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.dbName || "budgetBoy";

type GlobalMongoose = typeof globalThis & {
  mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cached = (globalThis as GlobalMongoose).mongoose || { conn: null, promise: null };
if (!(globalThis as GlobalMongoose).mongoose) {
  (globalThis as GlobalMongoose).mongoose = cached;
}

export async function connectToDB() {
  if (!MONGO_URL) {
    throw new Error("Missing MONGO_URL in environment variables.");
  }
  const mongoUrl = MONGO_URL;
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const startedAt = Date.now();
    cached.promise = mongoose.connect(mongoUrl, { dbName: DB_NAME });
    cached.promise
      .then(() => {
        logger.info("mongoose_connect_ok", { durationMs: Date.now() - startedAt, dbName: DB_NAME });
      })
      .catch(() => undefined);
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    logger.error("mongoose_connect_failed", { err: e instanceof Error ? e.message : String(e) });
    cached.promise = null;
    cached.conn = null;
    throw e;
  }
}
