import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/api/server/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sendBugConfirmation, notifyAdminNewBug } from "@/app/api/server/bug-email";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";

const CreateBugSchema = z.object({
  reporterName: z.string().min(1).max(120).trim(),
  reporterEmail: z.string().email().max(320).trim(),
  description: z.string().min(10).max(5000).trim(),
});

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request);
  try {
    const p = prisma as any;
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimit = checkRateLimit(`bugs:${clientIp}`, {
      windowMs: 60_000,
      maxRequests: 5,
    });
    if (!rateLimit.allowed) {
      const resp = NextResponse.json(
        { error: "Too many requests", code: "TOO_MANY_REQUESTS" },
        { status: 429 },
      );
      resp.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return withRequestHeaders(resp, requestContext);
    }

    const body = await request.json().catch(() => null);
    const parsed = CreateBugSchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const { reporterName, reporterEmail, description } = parsed.data;

    const bug = await p.bugReport.create({
      data: {
        reporterName,
        reporterEmail,
        description,
        source: "dashboard",
        requestId: requestContext.requestId,
      },
    });

    // Fire-and-forget emails — don't let failures block the response
    sendBugConfirmation({
      to: reporterEmail,
      name: reporterName,
      description,
      bugId: bug.id,
    }).catch(() => {});

    notifyAdminNewBug({
      name: reporterName,
      email: reporterEmail,
      description,
      bugId: bug.id,
    }).catch(() => {});

    return withRequestHeaders(
      NextResponse.json({ ok: true, id: bug.id }, { status: 201 }),
      requestContext,
    );
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
