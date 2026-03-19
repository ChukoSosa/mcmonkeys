import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/app/api/server/api-error";
import { localDevMockStore } from "@/lib/mock/store";
import { getRuntimePolicy } from "@/lib/runtime/profile";

export async function POST() {
  try {
    const policy = getRuntimePolicy();
    if (!policy.isLocalDev) {
      throw new ApiError(404, "NOT_FOUND", "Mock reset is only available in local developer mode");
    }

    localDevMockStore.reset();
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}