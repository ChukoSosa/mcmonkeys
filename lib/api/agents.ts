import { apiFetch } from "./client";
import { AgentsResponseSchema } from "@/lib/schemas";
import type { Agent } from "@/lib/schemas";
import { shouldUseMockData } from "./mockMode";
import { MOCK_AGENTS } from "@/lib/mock/data";

function isMcLucySupervisorAgent(agent: Agent): boolean {
  const normalizedId = agent.id.toLowerCase();
  const normalizedName = agent.name.toLowerCase();
  return normalizedId === "mclucy-chief" || normalizedName === "mclucy";
}

function toOperationalAgents(agents: Agent[]): Agent[] {
  return agents.filter((agent) => !isMcLucySupervisorAgent(agent));
}

export async function getAgents(): Promise<Agent[]> {
  if (shouldUseMockData()) {
    return toOperationalAgents(MOCK_AGENTS);
  }

  const raw = await apiFetch<unknown>("/api/agents");
  const parsed = AgentsResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[getAgents] schema mismatch", parsed.error.flatten());
    return [];
  }
  return toOperationalAgents(parsed.data.agents);
}
