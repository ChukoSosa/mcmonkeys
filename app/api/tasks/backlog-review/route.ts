import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { isMissionControlDemoMode, demoReadOnlyResponse } from "@/app/api/server/demo-mode";
import { createRequestContext, withRequestHeaders } from "@/app/api/server/request-context";
import { runBacklogHealthReview } from "@/app/api/server/backlog-health-review";

const BacklogReviewBodySchema = z.object({
  dryRun: z.boolean().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export async function POST(request: NextRequest) {
  const requestContext = createRequestContext(request);
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsed = BacklogReviewBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const dryRun = parsed.data.dryRun ?? false;
    if (isMissionControlDemoMode() && !dryRun) {
      return withRequestHeaders(demoReadOnlyResponse(), requestContext);
    }

    const review = await runBacklogHealthReview({
      dryRun,
      limit: parsed.data.limit,
    });

    return withRequestHeaders(NextResponse.json(review), requestContext);
  } catch (error) {
    return withRequestHeaders(apiErrorResponse(error, requestContext), requestContext);
  }
}
