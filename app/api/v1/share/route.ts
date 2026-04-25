import { createApiContext } from "@/lib/api/context";
import { postShare } from "@/lib/api/handlers/v1/sharePost";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/share");
  return withRouteMetrics(ctx, "POST", () => postShare(req, ctx));
}
