import { randomUUID } from "crypto";
import { logger, type Logger } from "@/lib/logger";

export type ApiContext = {
  requestId: string;
  log: Logger;
};

export function createApiContext(req: Request, route: string): ApiContext {
  const requestId = req.headers.get("x-request-id")?.trim() || randomUUID();
  const log = logger.child({ requestId, route });
  return { requestId, log };
}
