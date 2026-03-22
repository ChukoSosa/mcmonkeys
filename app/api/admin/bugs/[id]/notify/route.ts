import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/api/server/prisma";
import { getAdminSession } from "@/lib/security/admin-session";
import { apiErrorResponse, ApiError } from "@/app/api/server/api-error";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";
import { sendBugResolved } from "@/app/api/server/bug-email";

const IdSchema = z.object({ id: z.string().min(1) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestContext = createRequestContext(request);
  try {
    const p = prisma as any;
    const session = await getAdminSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Not authenticated");

    const { id } = IdSchema.parse(await params);
    const bug = await p.bugReport.findUnique({ where: { id } });
    if (!bug) throw new ApiError(404, "NOT_FOUND", "Bug not found");

    if (bug.notifiedAt) {
      throw new ApiError(409, "CONFLICT", "User was already notified for this bug");
    }

    await sendBugResolved({
      to: bug.reporterEmail,
      name: bug.reporterName,
      resolution: bug.resolutionSummary ?? "",
      bugId: bug.id,
    });

    const updated = await p.bugReport.update({
      where: { id },
      data: { notifiedAt: new Date() },
    });

    return withRequestHeaders(NextResponse.json(updated), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
