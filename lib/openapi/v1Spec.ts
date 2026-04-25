/** OpenAPI 3.0 document for BudgetBoy HTTP API v1. */
export const openApiV1Document = {
  openapi: "3.0.3",
  info: {
    title: "BudgetBoy API",
    version: "1.0.0",
    description:
      "Telecom & subscription optimization for Indian households. All routes are under `/api/v1`. Errors return a stable `error.code` (see `ApiErrorCodes` in the codebase). Every response includes `x-request-id`.",
  },
  servers: [{ url: "/", description: "Same origin (Next.js app)" }],
  tags: [
    { name: "Wizard", description: "Persist wizard payload and run optimizer" },
    { name: "Telecom", description: "Operator catalog helpers" },
    { name: "Share", description: "Shareable scenario snapshots" },
    { name: "Meta", description: "API discovery" },
  ],
  paths: {
    "/api/v1/openapi": {
      get: {
        tags: ["Meta"],
        summary: "OpenAPI document",
        description: "Machine-readable spec for this API version.",
        responses: {
          "200": {
            description: "OpenAPI 3.0 JSON document",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
    "/api/v1/user": {
      post: {
        tags: ["Wizard"],
        summary: "Save wizard profile",
        description: "Validates body with the same schema as analyze, then persists a `User` document in MongoDB.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WizardPayload" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            headers: {
              "x-request-id": { schema: { type: "string" }, description: "Correlation id" },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "success"],
                  properties: { id: { type: "string" }, success: { type: "boolean", enum: [true] } },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/v1/analyze": {
      post: {
        tags: ["Wizard"],
        summary: "Run budget analysis",
        description: "Runs server-side optimizer against Mongo catalog and merges optional AI suggestions.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WizardPayload" },
            },
          },
        },
        responses: {
          "200": {
            description: "Optimization result",
            headers: {
              "x-request-id": { schema: { type: "string" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OptimizationResult" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/v1/telecom/plans": {
      get: {
        tags: ["Telecom"],
        summary: "List catalog plans for a provider",
        parameters: [
          {
            name: "provider",
            in: "query",
            schema: { type: "string", enum: ["Jio", "Airtel", "VI", "BSNL"], default: "Jio" },
            description: "Operator name",
          },
        ],
        responses: {
          "200": {
            description: "Plans with derived metrics",
            headers: { "x-request-id": { schema: { type: "string" } } },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    plans: { type: "array", items: { type: "object" } },
                    trendingPlans: { type: "array", items: { type: "object" } },
                    bestValuePlan: { nullable: true, type: "object" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/v1/share": {
      post: {
        tags: ["Share"],
        summary: "Create a shareable scenario snapshot",
        description: "Stores a lightweight snapshot and returns a UUID share id.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ShareCreatePayload" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            headers: { "x-request-id": { schema: { type: "string" } } },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["shareId", "success"],
                  properties: {
                    shareId: { type: "string", format: "uuid" },
                    success: { type: "boolean", enum: [true] },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/api/v1/share/{shareId}": {
      get: {
        tags: ["Share"],
        summary: "Get shared scenario snapshot by UUID",
        parameters: [
          {
            name: "shareId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Share identifier",
          },
        ],
        responses: {
          "200": {
            description: "Shared snapshot",
            headers: { "x-request-id": { schema: { type: "string" } } },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["shareId", "scenarioName", "snapshot"],
                  properties: {
                    shareId: { type: "string", format: "uuid" },
                    scenarioName: { type: "string" },
                    snapshot: { $ref: "#/components/schemas/SharedSnapshot" },
                    createdAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": { $ref: "#/components/responses/ServerError" },
        },
      },
    },
  },
  components: {
    responses: {
      BadRequest: {
        description: "Validation or malformed JSON",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
            examples: {
              validation: {
                value: {
                  error: {
                    code: "VALIDATION_FAILED",
                    message: "Request validation failed.",
                    details: { zod: { formErrors: [], fieldErrors: {} } },
                  },
                  requestId: "550e8400-e29b-41d4-a716-446655440000",
                },
              },
            },
          },
        },
      },
      ServerError: {
        description: "Unexpected or infrastructure failure",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
          },
        },
      },
      NotFound: {
        description: "Entity not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
          },
        },
      },
    },
    schemas: {
      ApiErrorEnvelope: {
        type: "object",
        required: ["error", "requestId"],
        properties: {
          requestId: { type: "string", format: "uuid" },
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: {
                type: "string",
                enum: [
                  "INVALID_JSON",
                  "VALIDATION_FAILED",
                  "INVALID_PROVIDER",
                  "TELECOM_FETCH_FAILED",
                  "DATABASE_ERROR",
                  "ANALYSIS_FAILED",
                  "SHARE_NOT_FOUND",
                  "SHARE_CREATE_FAILED",
                ],
              },
              message: { type: "string" },
              details: { description: "Structured context (e.g. Zod flatten, allowed values)" },
            },
          },
        },
      },
      WizardPayload: {
        type: "object",
        description: "Full wizard state (Zod: wizardSchema). See project `utils/validators.ts`.",
        required: ["mode", "city", "members", "subscriptions", "wifi"],
        properties: {
          mode: { type: "string", enum: ["individual", "family", "friends"] },
          city: {
            type: "string",
            enum: ["Bangalore", "Chennai", "Mumbai", "Delhi", "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Other"],
          },
          members: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: [
                "name",
                "provider",
                "currentPlanPrice",
                "validity",
                "planDataPerDay",
                "actualUsagePerDay",
                "lineUsageType",
                "rechargeIntent",
                "priority",
                "callingNeed",
                "needsOtt",
              ],
              properties: {
                name: { type: "string" },
                provider: { type: "string", enum: ["Jio", "Airtel", "VI", "BSNL"] },
                currentPlanPrice: { type: "number", minimum: 0 },
                validity: { type: "string", enum: ["28", "56", "84", "365"] },
                planDataPerDay: { type: "string", enum: ["1GB", "1.5GB", "2GB", "3GB"] },
                actualUsagePerDay: { type: "string", enum: ["0.5GB", "1GB", "1.5GB", "2GB+"] },
                lineUsageType: { type: "string", enum: ["calls-only", "light", "medium", "heavy"] },
                rechargeIntent: {
                  type: "string",
                  enum: ["calls-only", "data-only", "both-balanced", "streaming-heavy", "senior-basic", "work-business"],
                },
                priority: { type: "string", enum: ["lowest-cost", "best-network", "balanced"] },
                callingNeed: { type: "string", enum: ["rare", "regular", "high", "unlimited-needed"] },
                needsOtt: { type: "boolean" },
              },
            },
          },
          subscriptions: {
            type: "array",
            items: {
              type: "object",
              required: ["name", "cost", "used"],
              properties: {
                name: { type: "string" },
                cost: { type: "number" },
                used: { type: "boolean" },
              },
            },
          },
          wifi: {
            type: "object",
            required: ["cost", "usageType"],
            properties: {
              cost: { type: "number", minimum: 0 },
              usageType: { type: "string", enum: ["light", "moderate", "heavy", "work-from-home"] },
            },
          },
          income: { type: "number", minimum: 0, description: "Optional monthly income (INR)" },
        },
      },
      OptimizationResult: {
        type: "object",
        description: "Server optimizer output; see `lib/optimizerTypes.ts` for full shape.",
        properties: {
          currentCost: { type: "number" },
          optimizedCost: { type: "number" },
          savings: { type: "number" },
          suggestions: { type: "array", items: { type: "string" } },
          memberOptimizations: { type: "array", items: { type: "object" } },
          totalFamilyTelecomSavings: { type: "number" },
          overpaySummary: { type: "string", nullable: true },
          planRecommendations: { type: "array", items: { type: "object" } },
          bestValuePlan: { nullable: true, type: "object" },
          trendingPlans: { type: "array", items: { type: "object" } },
        },
      },
      SharedSnapshot: {
        type: "object",
        required: ["currentCost", "optimizedCost", "savings", "avoidableWaste", "members", "subscriptions", "suggestions"],
        properties: {
          currentCost: { type: "number" },
          optimizedCost: { type: "number" },
          savings: { type: "number" },
          avoidableWaste: { type: "number" },
          members: { type: "integer", minimum: 0 },
          subscriptions: { type: "integer", minimum: 0 },
          suggestions: { type: "array", items: { type: "string" } },
        },
      },
      ShareCreatePayload: {
        type: "object",
        required: ["scenarioName", "snapshot"],
        properties: {
          scenarioName: { type: "string" },
          snapshot: { $ref: "#/components/schemas/SharedSnapshot" },
        },
      },
    },
  },
} as const;
