import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { listActiveBacklogFlags } from "@/app/api/server/backlog-health-review";

const ValidationFlagsQuerySchema = z.object({
  includeBlocked: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const parsed = ValidationFlagsQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const flags = await listActiveBacklogFlags({
      includeBlocked: parsed.data.includeBlocked === "true",
      limit: parsed.data.limit,
    });

    return NextResponse.json({
      total: flags.length,
      flags,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
