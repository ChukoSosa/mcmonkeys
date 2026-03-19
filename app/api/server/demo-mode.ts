import { NextResponse } from "next/server";
import { ApiError } from "@/app/api/server/api-error";
import { getRuntimePolicy } from "@/lib/runtime/profile";

const READ_ONLY_MESSAGE = "The public live demo is read-only.";

export function isMissionControlDemoMode(): boolean {
  return getRuntimePolicy().isOnlineDemo;
}

export function isLocalDevMockMode(): boolean {
  return getRuntimePolicy().isLocalDev;
}

export function assertDemoWritable(): void {
  if (getRuntimePolicy().isReadOnly) {
    throw new ApiError(403, "BAD_REQUEST", READ_ONLY_MESSAGE);
  }
}

export function demoReadOnlyResponse() {
  return NextResponse.json({ error: READ_ONLY_MESSAGE }, { status: 403 });
}