import { createApiContext } from "@/lib/api/context";
import { getTelecomPlansHandler } from "@/lib/api/handlers/v1/telecomPlansGet";

export async function GET(req: Request) {
  const ctx = createApiContext(req, "GET /api/v1/telecom/plans");
  ctx.log.info("request");
  return getTelecomPlansHandler(req, ctx);
}
