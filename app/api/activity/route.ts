import { NextRequest, NextResponse } from "next/server";
import { activityService } from "@/app/api/server/activity-service";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { isLocalDevMockMode } from "@/app/api/server/demo-mode";
import { localDevMockStore } from "@/lib/mock/store";
import { z } from "zod";

const ActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  agentId: z.string().min(1).optional(),
  subtaskId: z.string().min(1).optional(),
  commentId: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  actorType: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = ActivityQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const {
      limit = 50,
      cursor,
      taskId,
      agentId,
      subtaskId,
      commentId,
      actorId,
      actorType,
    } = parsed.data;

    if (isLocalDevMockMode()) {
      const { events, nextCursor } = localDevMockStore.listActivity({
        limit,
        taskId,
        agentId,
        subtaskId,
        commentId,
        actorId,
        actorType,
      });
      return NextResponse.json({ activities: events, nextCursor, events });
    }

    const { events, nextCursor } = await activityService.list({
      limit,
      cursor,
      taskId,
      agentId,
      subtaskId,
      commentId,
      actorId,
      actorType,
    });

    return NextResponse.json({ activities: events, nextCursor, events });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
