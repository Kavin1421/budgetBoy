import { createApiContext } from "@/lib/api/context";
import { postContact } from "@/lib/api/handlers/v1/contactPost";
import { withRouteMetrics } from "@/lib/api/withRouteMetrics";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/contact");
  return withRouteMetrics(ctx, "POST", () => postContact(req, ctx));
}
