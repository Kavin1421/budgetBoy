import { createApiContext } from "@/lib/api/context";
import { postRecommendationFeedback } from "@/lib/api/handlers/v1/recommendationFeedbackPost";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/recommendations/feedback");
  return withRouteMetrics(ctx, "POST", () => postRecommendationFeedback(req, ctx));
}
