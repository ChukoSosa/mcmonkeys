export const CARD_SOURCE_CHANNELS = [
  "openclaw-chat",
  "telegram",
  "manual-ui",
  "system",
] as const;

export type CardSourceChannel = (typeof CARD_SOURCE_CHANNELS)[number];

export const CARD_STATUSES = [
  "draft",
  "intake",
  "ready",
  "in_progress",
  "blocked",
  "review",
  "done",
  "canceled",
] as const;

export type CardStatus = (typeof CARD_STATUSES)[number];

export const CARD_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export type CardPriority = (typeof CARD_PRIORITIES)[number];

export const CARD_STATUS_LABELS: Record<CardStatus, string> = {
  draft: "Draft",
  intake: "Intake",
  ready: "Ready",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Review",
  done: "Done",
  canceled: "Canceled",
};

export const CARD_PRIORITY_LABELS: Record<CardPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const CARD_SOURCE_LABELS: Record<CardSourceChannel, string> = {
  "openclaw-chat": "OpenClaw Chat",
  telegram: "Telegram",
  "manual-ui": "Manual UI",
  system: "System",
};
