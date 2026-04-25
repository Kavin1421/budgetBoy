import OpenAI from "openai";
import { logger } from "@/lib/logger";
import type { WizardInput } from "@/utils/validators";

export async function generateAISuggestions(data: WizardInput): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "YOUR_API_KEY") {
    return [];
  }

  try {
    const startedAt = Date.now();
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Suggest cost optimization for telecom and subscriptions in India for this user: ${JSON.stringify(data)}. Return 3 short bullet suggestions.`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output_text || "";
    const suggestions = text
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    logger.info("openai_suggestions_ok", { count: suggestions.length, durationMs: Date.now() - startedAt });
    return suggestions;
  } catch (e) {
    logger.warn("openai_suggestions_failed", { err: e instanceof Error ? e.message : String(e) });
    return [];
  }
}
