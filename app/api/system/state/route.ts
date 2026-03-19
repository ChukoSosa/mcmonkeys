import { NextResponse } from "next/server";
import { getMissionSystemState, markMissionSystemReady } from "@/lib/mission/systemState";
import { isMissionControlDemoMode } from "@/app/api/server/demo-mode";
import { bootstrapMissionControl } from "@/lib/mission/bootstrap";
import { getRuntimePolicy } from "@/lib/runtime/profile";

export async function GET() {
  const policy = getRuntimePolicy();

  if (isMissionControlDemoMode() || policy.isLocalDev) {
    markMissionSystemReady();
    return NextResponse.json({
      state: getMissionSystemState(),
      generatedAt: new Date().toISOString(),
    });
  }

  const bootstrapResult = await bootstrapMissionControl();

  return NextResponse.json({
    state: bootstrapResult.state,
    generatedAt: new Date().toISOString(),
  });
}
