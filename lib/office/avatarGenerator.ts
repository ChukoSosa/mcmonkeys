import type { Agent } from "@/types";
import { apiFetch } from "@/lib/api/client";

export const AVATAR_STORAGE_KEY = "mission-control-agent-avatars";

function getRolePrompt(agent: Agent): string {
  const name = (agent.name ?? "").toLowerCase();

  if (name.includes("claudio")) {
    return "character: project manager developer, wearing a brown hat and glasses, blue shirt, holding a small clipboard, calm expression, organized tech leader vibe.";
  }

  if (name.includes("codi")) {
    return "character: frontend developer designer, colorful hair, headphones, casual shirt, creative tech vibe.";
  }

  if (name.includes("ninja")) {
    return "character: backend developer ninja, dark hoodie or ninja outfit, mysterious hacker vibe.";
  }

  if (name.includes("lucy")) {
    return "character: operations manager woman, yellow jacket, confident posture.";
  }

  const role = (agent.role ?? "").trim() || "tech operator";
  return `character: ${role}, focused posture, professional mission control vibe.`;
}

export function buildAvatarPrompt(agent: Agent): string {
  const base =
    "minimalist pixel art character, full body, very large pixels, 8-bit style, flat colors, no shading, simple geometric shapes, retro npc style, limited color palette, square pixel grid.";
  const style =
    "same pixel art style, same proportions, same scale, same pixel size, centered character, simple eyes and mouth, solid muted blue background.";

  return [base, getRolePrompt(agent), style].join("\n\n");
}

async function callNanoBananaStub(prompt: string, seed: string): Promise<string> {
  void prompt;
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodedSeed}&backgroundColor=1e2e45`;
}

export function readAvatarMappingFromStorage(): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(AVATAR_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === "string") acc[key] = value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function saveAvatarMappingToStorage(mapping: Record<string, string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(mapping));
}

export async function persistAvatar(agentId: string, avatarUrl: string, prompt: string): Promise<void> {
  try {
    await apiFetch(`/api/agents/${agentId}/avatar`, {
      method: "POST",
      body: JSON.stringify({ avatarUrl, prompt }),
    });
  } catch {
    // Optional endpoint: fallback persistence is handled in localStorage.
  }
}

export async function generateAvatar(agent: Agent): Promise<{ avatarUrl: string; prompt: string }> {
  const prompt = buildAvatarPrompt(agent);
  const avatarUrl = await callNanoBananaStub(prompt, `${agent.id}-${agent.name}`);
  return { avatarUrl, prompt };
}
