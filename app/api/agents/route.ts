import { NextRequest, NextResponse } from "next/server";
import { agentService } from "@/app/api/server/agent-service";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { isMissionControlDemoMode, demoReadOnlyResponse } from "@/app/api/server/demo-mode";
import { z } from "zod";

function isMcLucySupervisorAgent(agent: { id: string; name: string }): boolean {
  const normalizedId = agent.id.toLowerCase();
  const normalizedName = agent.name.toLowerCase();
  return normalizedId === "mclucy-chief" || normalizedName === "mclucy";
}

const AgentHeartbeatBodySchema = z.object({
  agentId: z.string().min(1, "agentId is required"),
  status: z.enum(["IDLE", "THINKING", "WORKING", "BLOCKED"]).optional(),
  statusMessage: z.string().max(300).optional(),
});

export async function GET() {
  try {
    const agents = (await agentService.list()).filter((agent) => !isMcLucySupervisorAgent(agent));
    return NextResponse.json({ agents });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isMissionControlDemoMode()) {
      return demoReadOnlyResponse();
    }

    const body = await request.json();
    const parsed = AgentHeartbeatBodySchema.safeParse(body);
    if (!parsed.success) {
      throw validationError(parsed.error);
    }

    const { agentId, status, statusMessage } = parsed.data;

    const agent = await agentService.heartbeat(agentId, { status, statusMessage });
    return NextResponse.json(agent);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
