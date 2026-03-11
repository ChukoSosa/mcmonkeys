import type { Agent } from "@/types";
import { apiFetch } from "@/lib/api/client";

export const AVATAR_STORAGE_KEY = "mission-control-agent-avatars";
const BASE_STYLE_PROMPT =
  "minimalist pixel art character, full body, very large pixels, 8-bit style, flat colors, no shading, simple geometric shapes, retro video game npc style, square pixel grid, simple eyes and mouth, limited color palette, clean outline, centered character, solid pastel background, similar to classic pixel people sprite sheets, highly simplified design, chunky pixels, minimal detail";

const PER_AGENT_VARIATIONS: Record<string, string> = {
  claudio:
    "character: project manager developer, wearing a brown hat and glasses, blue shirt, holding a small clipboard, calm expression, organized tech leader vibe.",
  codi:
    "character: frontend developer designer, colorful hair, wearing headphones, casual shirt, creative tech vibe.",
  ninja:
    "character: backend developer ninja, dark hoodie or ninja outfit, mysterious tech hacker vibe.",
  lucy:
    "character: operations manager woman, yellow jacket, confident posture, professional but casual.",
};

const hairStyles = ["short straight hair", "curly bob", "side-part hair", "spiky short hair", "ponytail"];
const hairColors = ["black", "dark brown", "chestnut", "blonde", "auburn", "teal"];
const hats = ["none", "baseball cap", "beanie", "fedora", "headband"];
const accessories = ["none", "glasses", "headphones", "earpiece", "small badge"];
const shirts = ["hoodie", "polo shirt", "jacket", "t-shirt", "sweater"];
const shirtColors = ["blue", "yellow", "green", "gray", "red", "purple"];
const pants = ["jeans", "cargo pants", "formal pants", "joggers"];
const pantsColors = ["dark blue", "black", "brown", "gray"];
const shoes = ["sneakers", "boots", "loafers", "running shoes"];
const shoesColors = ["black", "white", "brown", "gray"];
const backgrounds = ["soft pink", "muted blue", "warm beige", "mint pastel", "lavender pastel"];

function randomItem(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)] ?? values[0];
}

function buildRandomizedCharacterBlock(agent: Agent): string {
  const roleHint = agent.role ? `role vibe: ${agent.role}.` : "role vibe: mission control operator.";

  return `Create a pixel art avatar using the STYLE DNA rules.

Randomize the character with the following attributes:

hair: ${randomItem(hairStyles)}
hair color: ${randomItem(hairColors)}

hat: ${randomItem(hats)}

accessory: ${randomItem(accessories)}

shirt: ${randomItem(shirts)}
shirt color: ${randomItem(shirtColors)}

pants: ${randomItem(pants)}
pants color: ${randomItem(pantsColors)}

shoes: ${randomItem(shoes)}
shoes color: ${randomItem(shoesColors)}

background color: ${randomItem(backgrounds)}

character: ${agent.name}, ${roleHint}

Keep the exact same pixel art style defined in the STYLE DNA.
Keep the avatar centered.
Keep the proportions identical to the system avatar style.
Do not add extra details.
Maintain the minimalist pixel look.`;
}

export function buildAvatarPrompt(agent: Agent): string {
  const agentKey = agent.name.trim().toLowerCase();
  const specificBlock = PER_AGENT_VARIATIONS[agentKey];

  if (specificBlock) {
    return `${BASE_STYLE_PROMPT}

${specificBlock}

simple geometric shapes, limited color palette, simple eyes and mouth, centered character, solid background, sprite sheet style pixel character.`;
  }

  return `${BASE_STYLE_PROMPT}

${buildRandomizedCharacterBlock(agent)}`;
}

async function callGenerateAvatarApi(prompt: string): Promise<string> {
  const res = await fetch("/api/generate-avatar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `Avatar generation failed (${res.status})`);
  }

  const { avatarUrl } = await res.json();
  return avatarUrl as string;
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
  const avatarUrl = await callGenerateAvatarApi(prompt);
  return { avatarUrl, prompt };
}

function isLikelyImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  const lowered = value.toLowerCase();
  return (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.startsWith("data:image/") ||
    lowered.startsWith("/")
  );
}

function normalizeAvatarUrl(rawUrl: string): string {
  if (rawUrl.startsWith("data:image/")) return rawUrl;
  if (rawUrl.startsWith("/proxy/")) return rawUrl;

  const proxyablePrefixes = ["/api/", "/uploads/", "/media/", "/storage/", "/files/"];

  if (rawUrl.startsWith("api/")) return `/proxy/${rawUrl}`;

  if (proxyablePrefixes.some((prefix) => rawUrl.startsWith(prefix))) {
    return `/proxy${rawUrl}`;
  }

  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    try {
      const parsed = new URL(rawUrl);
      const pathWithQuery = `${parsed.pathname}${parsed.search}`;
      if (proxyablePrefixes.some((prefix) => parsed.pathname.startsWith(prefix))) {
        return `/proxy${pathWithQuery}`;
      }
    } catch {
      // keep original if URL parsing fails
    }
  }

  return rawUrl;
}

function findNestedAvatarUrl(input: unknown, depth = 0): string | undefined {
  if (!input || depth > 4 || typeof input !== "object") return undefined;

  const obj = input as Record<string, unknown>;
  const preferredKeys = [
    "avatarUrl",
    "avatar_url",
    "imageUrl",
    "image_url",
    "photoUrl",
    "photo_url",
    "pictureUrl",
    "picture_url",
    "spriteUrl",
    "sprite_url",
    "url",
  ];

  for (const key of preferredKeys) {
    if (isLikelyImageUrl(obj[key])) return obj[key];
  }

  for (const [key, value] of Object.entries(obj)) {
    if (isLikelyImageUrl(value) && /(avatar|image|photo|picture|sprite)/i.test(key)) {
      return value;
    }
  }

  for (const value of Object.values(obj)) {
    const nested = findNestedAvatarUrl(value, depth + 1);
    if (nested) return nested;
  }

  return undefined;
}

export function resolveAgentAvatarUrl(agent: Agent): string | undefined {
  const dynamicAgent = agent as Agent & Record<string, unknown>;

  const directCandidates = [
    agent.avatarUrl,
    typeof dynamicAgent.avatar === "string" ? dynamicAgent.avatar : undefined,
    typeof dynamicAgent.avatar_url === "string" ? dynamicAgent.avatar_url : undefined,
    typeof dynamicAgent.imageUrl === "string" ? dynamicAgent.imageUrl : undefined,
    typeof dynamicAgent.image_url === "string" ? dynamicAgent.image_url : undefined,
    typeof dynamicAgent.photoUrl === "string" ? dynamicAgent.photoUrl : undefined,
    typeof dynamicAgent.photo_url === "string" ? dynamicAgent.photo_url : undefined,
  ];

  const direct = directCandidates.find((v): v is string => typeof v === "string" && v.length > 0);
  if (direct) return normalizeAvatarUrl(direct);

  const nested = findNestedAvatarUrl(dynamicAgent);
  return nested ? normalizeAvatarUrl(nested) : undefined;
}
