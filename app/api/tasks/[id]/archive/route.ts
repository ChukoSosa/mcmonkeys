import { NextRequest, NextResponse } from "next/server";
import { taskService } from "@/app/api/server/task-service";
import { apiErrorResponse } from "@/app/api/server/api-error";
import { demoReadOnlyResponse, isLocalDevMockMode, isMissionControlDemoMode } from "@/app/api/server/demo-mode";
import { localDevMockStore } from "@/lib/mock/store";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (isMissionControlDemoMode()) {
      return demoReadOnlyResponse();
    }

    const { id } = await params;
    if (isLocalDevMockMode()) {
      const task = localDevMockStore.archiveTask(id);
      return NextResponse.json(task);
    }

    const task = await taskService.archive(id);
    return NextResponse.json(task);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
