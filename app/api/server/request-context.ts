import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export interface RequestContext {
  requestId: string;
  method: string;
  pathname: string;
}

export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: request.headers.get("x-request-id") ?? randomUUID(),
    method: request.method,
    pathname: request.nextUrl.pathname,
  };
}

export function withRequestHeaders(response: NextResponse, context: RequestContext): NextResponse {
  response.headers.set("x-request-id", context.requestId);
  return response;
}