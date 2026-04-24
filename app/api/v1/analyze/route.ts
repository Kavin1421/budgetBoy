import { createApiContext } from "@/lib/api/context";
import { postAnalyze } from "@/lib/api/handlers/v1/analyzePost";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/analyze");
  ctx.log.info("request");
  return postAnalyze(req, ctx);
}
