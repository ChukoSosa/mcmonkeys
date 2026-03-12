import {
  CARD_PRIORITIES,
  CARD_PRIORITY_LABELS,
  CARD_SOURCE_CHANNELS,
  CARD_SOURCE_LABELS,
  CARD_STATUSES,
  CARD_STATUS_LABELS,
  type CardPriority,
  type CardSourceChannel,
  type CardStatus,
} from "@/lib/cards/constants";
import type { Card, NewCardInput } from "@/types/cards";

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function isCardStatus(value: unknown): value is CardStatus {
  return typeof value === "string" && (CARD_STATUSES as readonly string[]).includes(value);
}

export function isCardPriority(value: unknown): value is CardPriority {
  return typeof value === "string" && (CARD_PRIORITIES as readonly string[]).includes(value);
}

export function isCardSourceChannel(value: unknown): value is CardSourceChannel {
  return typeof value === "string" && (CARD_SOURCE_CHANNELS as readonly string[]).includes(value);
}

export function cardStatusLabel(status: CardStatus): string {
  return CARD_STATUS_LABELS[status];
}

export function cardPriorityLabel(priority: CardPriority): string {
  return CARD_PRIORITY_LABELS[priority];
}

export function cardSourceLabel(channel: CardSourceChannel): string {
  return CARD_SOURCE_LABELS[channel];
}

export function createEmptyCard(overrides: Partial<NewCardInput> = {}): Card {
  const timestamp = nowIso();

  return {
    id: overrides.id ?? randomId("card"),
    title: overrides.title ?? "",
    description: overrides.description ?? "",
    createdAt: overrides.createdAt ?? timestamp,
    updatedAt: overrides.updatedAt ?? timestamp,

    sourceChannel: overrides.sourceChannel ?? "manual-ui",
    sourceMessageId: overrides.sourceMessageId,
    sourceContext: overrides.sourceContext,
    requestedBy: overrides.requestedBy,
    createdByAgentId: overrides.createdByAgentId,

    assigneeAgentId: overrides.assigneeAgentId,
    ownerAgentId: overrides.ownerAgentId,
    watchers: overrides.watchers ?? [],

    status: overrides.status ?? "draft",
    priority: overrides.priority ?? "medium",

    blockers: overrides.blockers ?? [],
    nextStep: overrides.nextStep,
    evidence: overrides.evidence ?? [],
    completionNote: overrides.completionNote,

    tags: overrides.tags ?? [],
    relatedCardIds: overrides.relatedCardIds ?? [],
    dueAt: overrides.dueAt,
    startedAt: overrides.startedAt,
    completedAt: overrides.completedAt,
  };
}

export function isCard(value: unknown): value is Card {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<Card>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    isCardSourceChannel(candidate.sourceChannel) &&
    isCardStatus(candidate.status) &&
    isCardPriority(candidate.priority) &&
    Array.isArray(candidate.blockers) &&
    Array.isArray(candidate.evidence) &&
    Array.isArray(candidate.tags) &&
    Array.isArray(candidate.relatedCardIds)
  );
}

export function withUpdatedTimestamp<T extends { updatedAt: string }>(entity: T): T {
  return {
    ...entity,
    updatedAt: nowIso(),
  };
}
