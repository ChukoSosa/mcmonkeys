import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { logger } from "./logger";

interface ApiErrorContext {
  requestId?: string;
  method?: string;
  pathname?: string;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "TOO_MANY_REQUESTS"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function validationError(error: ZodError) {
  return new ApiError(400, "VALIDATION_ERROR", "Invalid request payload", error.flatten());
}

export function apiErrorResponse(error: unknown, context?: ApiErrorContext) {
  if (error instanceof ApiError) {
    logger.warn({
      requestId: context?.requestId,
      method: context?.method,
      pathname: context?.pathname,
      code: error.code,
      status: error.status,
      details: error.details,
      message: error.message,
    }, "Handled API error");

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        requestId: context?.requestId,
      },
      { status: error.status },
    );
  }

  logger.error({
    requestId: context?.requestId,
    method: context?.method,
    pathname: context?.pathname,
    error,
  }, "Unhandled API error");

  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      requestId: context?.requestId,
    },
    { status: 500 },
  );
}
