/**
 * Stable machine-readable API error codes (BudgetBoy HTTP API v1).
 * Use with {@link jsonApiError} — do not change existing values without a version bump.
 */
export const ApiErrorCodes = {
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_PROVIDER: "INVALID_PROVIDER",
  TELECOM_FETCH_FAILED: "TELECOM_FETCH_FAILED",
  DATABASE_ERROR: "DATABASE_ERROR",
  ANALYSIS_FAILED: "ANALYSIS_FAILED",
  SHARE_NOT_FOUND: "SHARE_NOT_FOUND",
  SHARE_CREATE_FAILED: "SHARE_CREATE_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  BOT_BLOCKED: "BOT_BLOCKED",
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];
