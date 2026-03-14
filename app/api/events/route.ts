import { NextRequest, NextResponse } from "next/server";
import { onEvent } from "@/app/api/server/event-bus";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";

export const dynamic = "force-dynamic";

function isAllowedOrigin(request: NextRequest, origin: string | null): boolean {
  if (!origin) return true;

  const configured = process.env.MISSION_CONTROL_ALLOWED_ORIGINS;
  if (!configured || configured.trim().length === 0) {
    return origin === request.nextUrl.origin;
  }

  const allowedOrigins = configured
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin);
}

export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request);
  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(request, origin)) {
    return withRequestHeaders(
      NextResponse.json(
        {
          error: "Origin is not allowed",
          code: "FORBIDDEN",
          requestId: requestContext.requestId,
        },
        { status: 403 },
      ),
      requestContext,
    );
  }

  const allowedOrigin = origin ?? request.nextUrl.origin;

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  });

  const responseStream = new ReadableStream({
    start(controller) {
      // Listener for events
      const unsubscribe = onEvent((event) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        } catch (error) {
          console.error("Error encoding event:", error);
        }
      });

      // Keep-alive: send a keep-alive message every 15 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(":keep-alive\n\n"));
        } catch (error) {
          clearInterval(keepAliveInterval);
          unsubscribe();
          controller.close();
        }
      }, 15000);

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
        unsubscribe();
        controller.close();
      });
    },
  });

  return withRequestHeaders(new NextResponse(responseStream, { headers }), requestContext);
}
