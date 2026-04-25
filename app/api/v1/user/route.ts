import { createApiContext } from "@/lib/api/context";
import { postUser } from "@/lib/api/handlers/v1/userPost";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/user");
  return withRouteMetrics(ctx, "POST", () => postUser(req, ctx));
}
