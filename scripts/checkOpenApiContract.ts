import { openApiV1Document } from "@/lib/openapi/v1Spec";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getOperation(path: string, method: "get" | "post") {
  const pathItem = openApiV1Document.paths[path as keyof typeof openApiV1Document.paths] as
    | Record<string, unknown>
    | undefined;
  return pathItem?.[method] as { responses?: Record<string, unknown> } | undefined;
}

const requiredRoutes: Array<{ path: string; method: "get" | "post" }> = [
  { path: "/api/v1/openapi", method: "get" },
  { path: "/api/v1/user", method: "post" },
  { path: "/api/v1/analyze", method: "post" },
  { path: "/api/v1/telecom/plans", method: "get" },
  { path: "/api/v1/share", method: "post" },
  { path: "/api/v1/share/manage", method: "post" },
  { path: "/api/v1/share/{shareId}", method: "get" },
  { path: "/api/v1/share/{shareId}/revoke", method: "post" },
  { path: "/api/v1/recommendations/feedback", method: "post" },
];

for (const route of requiredRoutes) {
  const operation = getOperation(route.path, route.method);
  assert(operation, `Missing OpenAPI operation: ${route.method.toUpperCase()} ${route.path}`);
  assert(operation.responses, `Operation has no responses: ${route.method.toUpperCase()} ${route.path}`);
}

const badRequestSchema =
  openApiV1Document.components.schemas.ApiErrorEnvelope.properties.error.properties.code.enum;
assert(Array.isArray(badRequestSchema), "ApiErrorEnvelope error code enum is missing");
assert(badRequestSchema.includes("RATE_LIMITED"), "Missing RATE_LIMITED in ApiErrorEnvelope enum");
assert(badRequestSchema.includes("BOT_BLOCKED"), "Missing BOT_BLOCKED in ApiErrorEnvelope enum");

console.log("OpenAPI contract check passed.");
