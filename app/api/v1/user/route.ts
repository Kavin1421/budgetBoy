import { createApiContext } from "@/lib/api/context";
import { postUser } from "@/lib/api/handlers/v1/userPost";

export async function POST(req: Request) {
  const ctx = createApiContext(req, "POST /api/v1/user");
  ctx.log.info("request");
  return postUser(req, ctx);
}
