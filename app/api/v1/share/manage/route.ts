import { createApiContext } from "@/lib/api/context";
import { postShareManage } from "@/lib/api/handlers/v1/shareManagePost";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/share/manage");
  return withRouteMetrics(ctx, "POST", () => postShareManage(req, ctx));
}
