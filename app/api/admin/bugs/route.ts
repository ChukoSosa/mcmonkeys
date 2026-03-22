import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/api/server/prisma";
import { getAdminSession } from "@/lib/security/admin-session";
import { apiErrorResponse, validationError, ApiError } from "@/app/api/server/api-error";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";

const ListQuerySchema = z.object({
  status: z.enum(["NEW", "TRIAGED", "IN_PROGRESS", "FIXED", "CLOSED"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request);
  try {
    const p = prisma as any;
    const session = await getAdminSession();
    if (!session) {
      throw new ApiError(401, "UNAUTHORIZED", "Not authenticated");
    }

    const parsed = ListQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    if (!parsed.success) throw validationError(parsed.error);

    const { status, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const [bugs, total] = await Promise.all([
      p.bugReport.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          reporterName: true,
          reporterEmail: true,
          description: true,
          status: true,
          severity: true,
          priority: true,
          internalNotes: true,
          notifiedAt: true,
          resolutionSummary: true,
          source: true,
        },
      }),
      p.bugReport.count({ where: status ? { status } : undefined }),
    ]);

    return withRequestHeaders(
      NextResponse.json({ bugs, total, page, limit }),
      requestContext,
    );
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
