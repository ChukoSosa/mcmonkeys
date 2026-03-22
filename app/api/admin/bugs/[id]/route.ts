import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/api/server/prisma";
import { getAdminSession } from "@/lib/security/admin-session";
import { apiErrorResponse, validationError, ApiError } from "@/app/api/server/api-error";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";

const IdSchema = z.object({ id: z.string().min(1) });

const UpdateBugSchema = z.object({
  status: z.enum(["NEW", "TRIAGED", "IN_PROGRESS", "FIXED", "CLOSED"]).optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  resolutionSummary: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
});

export async function GET(
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

    return withRequestHeaders(NextResponse.json(bug), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestContext = createRequestContext(request);
  try {
    const p = prisma as any;
    const session = await getAdminSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Not authenticated");

    const { id } = IdSchema.parse(await params);
    const body = await request.json().catch(() => null);
    const parsed = UpdateBugSchema.safeParse(body);
    if (!parsed.success) throw validationError(parsed.error);

    const bug = await p.bugReport.update({
      where: { id },
      data: parsed.data,
    });

    return withRequestHeaders(NextResponse.json(bug), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
