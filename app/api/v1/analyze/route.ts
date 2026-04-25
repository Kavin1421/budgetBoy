import { createApiContext } from "@/lib/api/context";
import { postAnalyze } from "@/lib/api/handlers/v1/analyzePost";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/analyze");
  return withRouteMetrics(ctx, "POST", () => postAnalyze(req, ctx));
}
