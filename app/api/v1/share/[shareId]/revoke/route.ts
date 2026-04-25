import { createApiContext } from "@/lib/api/context";
import { postShareRevoke } from "@/lib/api/handlers/v1/shareRevokePost";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function POST(req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const ctx = createApiContext(req, "POST /api/v1/share/:shareId/revoke");
  const { shareId } = await params;
  return withRouteMetrics(ctx, "POST", () => postShareRevoke(req, shareId, ctx));
}
