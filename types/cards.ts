import type { CardPriority, CardSourceChannel, CardStatus } from "@/lib/cards/constants";

export interface CardRequester {
  id?: string;
  name?: string;
  handle?: string;
  channelUserId?: string;
}

export interface CardBlocker {
  id: string;
  reason: string;
  createdAt: string;
  createdByAgentId?: string;
  resolvedAt?: string;
}

export type CardEvidenceKind = "note" | "link" | "file";

export interface CardEvidence {
  id: string;
  kind: CardEvidenceKind;
  value: string;
  label?: string;
  addedAt: string;
  addedByAgentId?: string;
}

export type CardSourceContext = string | Record<string, unknown>;

export interface Card {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;

  sourceChannel: CardSourceChannel;
  sourceMessageId?: string;
  sourceContext?: CardSourceContext;
  requestedBy?: CardRequester;
  createdByAgentId?: string;

  assigneeAgentId?: string;
  ownerAgentId?: string;
  watchers?: string[];

  status: CardStatus;
  priority: CardPriority;

  blockers: CardBlocker[];
  nextStep?: string;
  evidence: CardEvidence[];
  completionNote?: string;

  tags: string[];
  relatedCardIds: string[];
  dueAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export type NewCardInput = Omit<
  Card,
  "id" | "createdAt" | "updatedAt" | "blockers" | "evidence" | "tags" | "relatedCardIds"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  blockers?: CardBlocker[];
  evidence?: CardEvidence[];
  tags?: string[];
  relatedCardIds?: string[];
};
