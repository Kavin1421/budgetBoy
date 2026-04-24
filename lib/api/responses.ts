import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/lib/api/errorCodes";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

export function jsonApiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  requestId: string,
  details?: unknown
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    requestId,
  };
  return NextResponse.json(body, {
    status,
    headers: { "x-request-id": requestId },
  });
}

/** Success JSON; `x-request-id` is always on the response headers. */
export function jsonSuccess<T>(data: T, requestId: string, status = 200): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: { "x-request-id": requestId },
  });
}
