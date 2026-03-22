import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/server/prisma";
import { getAdminSession } from "@/lib/security/admin-session";
import { apiErrorResponse, ApiError } from "@/app/api/server/api-error";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";

export async function GET(request: NextRequest) {
  const requestContext = createRequestContext(request);
  try {
    const session = await getAdminSession();
    if (!session) throw new ApiError(401, "UNAUTHORIZED", "Not authenticated");

    const users = await prisma.operator.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        preferences: true,
      },
    });

    return withRequestHeaders(NextResponse.json({ users, total: users.length }), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
