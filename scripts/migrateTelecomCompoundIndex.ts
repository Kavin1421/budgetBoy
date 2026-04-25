import mongoose from "mongoose";
import { connectToDB } from "@/lib/mongodb";
import { TelecomCatalogPlan } from "@/models/TelecomCatalogPlan";

async function run() {
  await connectToDB();
  const collection = TelecomCatalogPlan.collection;
  const indexes = await collection.indexes();

  for (const idx of indexes) {
    const key = idx.key as Record<string, number>;
    const indexName = idx.name;
    if (idx.unique && key.planId === 1 && Object.keys(key).length === 1 && indexName) {
      await collection.dropIndex(indexName);
      console.log(`Dropped old unique index: ${indexName}`);
    }
  }

  const hasCompound = indexes.some((idx) => {
    const key = idx.key as Record<string, number>;
    return key.provider === 1 && key.planId === 1 && Object.keys(key).length === 2;
  });

  if (!hasCompound) {
    await collection.createIndex({ provider: 1, planId: 1 }, { unique: true, name: "provider_1_planId_1" });
    console.log("Created compound unique index provider_1_planId_1");
  } else {
    console.log("Compound unique index already exists.");
  }
}

run()
  .then(async () => {
    await mongoose.disconnect();
  })
  .catch((err) => {
    console.error("migrateTelecomCompoundIndex failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
