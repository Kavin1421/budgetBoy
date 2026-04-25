import { createApiContext } from "@/lib/api/context";
import { getTelecomPlansHandler } from "@/lib/api/handlers/v1/telecomPlansGet";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function GET(req: Request) {
  const ctx = createApiContext(req, "GET /api/v1/telecom/plans");
  return withRouteMetrics(ctx, "GET", () => getTelecomPlansHandler(req, ctx));
}
