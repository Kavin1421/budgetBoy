import { createApiContext } from "@/lib/api/context";
import { getShareById } from "@/lib/api/handlers/v1/shareGet";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function GET(req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const ctx = createApiContext(req, "GET /api/v1/share/:shareId");
  const { shareId } = await params;
  return withRouteMetrics(ctx, "GET", () => getShareById(shareId, ctx));
}
