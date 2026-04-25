import { createApiContext } from "@/lib/api/context";
import { postShareRevoke } from "@/lib/api/handlers/v1/shareRevokePost";

export async function POST(req: Request, { params }: { params: Promise<{ shareId: string }> }) {
  const ctx = createApiContext(req, "POST /api/v1/share/:shareId/revoke");
  const { shareId } = await params;
  return postShareRevoke(req, shareId, ctx);
}
