import {
  MAX_RECOMMENDED_SUBTASKS,
  MIN_RECOMMENDED_SUBTASKS,
} from "@/lib/mission/decomposition";

export type MissionIntakeSourceChannel =
  | "openclaw-chat"
  | "telegram"
  | "manual-ui"
  | "system";

export type MissionIntakeConfidence = "high" | "medium" | "low";

export interface MissionRawIntakeRequest {
  sourceChannel: MissionIntakeSourceChannel;
  rawText: string;
  requestedBy?: string;
  requestedByUserId?: string;
  requestedAgentName?: string;
  requestedAgentId?: string;
  sourceMessageId?: string;
  sourceContext?: Record<string, unknown>;
  createdByAgentId?: string;
}

export interface MissionNormalizedIntakeRequest extends MissionRawIntakeRequest {
  rawText: string;
  requestedBy?: string;
  requestedByUserId?: string;
  requestedAgentName?: string;
  requestedAgentId?: string;
  sourceMessageId?: string;
  sourceContext?: Record<string, unknown>;
  createdByAgentId?: string;
}

export interface MissionDraftSubtask {
  title: string;
  description?: string;
  // Optional now so we can add explicit duration planning later without API breakage.
  estimatedMinutes?: number;
  position: number;
}

export interface MissionDraftTaskPayload {
  title: string;
  description: string;
  sourceChannel: MissionIntakeSourceChannel;
  requestedBy?: string;
  assignedAgentId?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  draftSubtasks: MissionDraftSubtask[];
  warnings: string[];
  intakeConfidence: MissionIntakeConfidence;
  sourceMessageId?: string;
  sourceContext?: Record<string, unknown>;
  createdByAgentId?: string;
}

export interface MissionDraftTaskValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

const SPLIT_REGEX = /[\n.;!?]+/g;
const CLAUSE_TRIM_REGEX = /^[\s\-:;,]+|[\s\-:;,]+$/g;

const CRITICAL_PRIORITY_HINTS = ["critical", "urgent", "asap", "immediately", "blocker", "production"]; 
const HIGH_PRIORITY_HINTS = ["today", "important", "priority", "high", "deadline"];

const ACTION_VERBS = [
  "build",
  "create",
  "implement",
  "design",
  "update",
  "refactor",
  "fix",
  "prepare",
  "ship",
  "deploy",
  "write",
  "define",
  "review",
  "test",
  "integrate",
  "configure",
  "optimize",
];

const INPUT_SIGNAL_REGEX = /\b(input|inputs|insumo|insumos|material|materiales|dependencia|dependencias|prerequisito|prerequisitos)\b/i;
const OUTPUT_SIGNAL_REGEX = /\b(output|outputs|resultado esperado|resultado|entregable|evidencia|criterio de completitud|criterio de done)\b/i;

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function sentenceCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function deriveTitle(rawText: string): string {
  const firstChunk = rawText.split(SPLIT_REGEX)[0]?.trim() ?? "";
  const firstClause = firstChunk.split(/\s+(?:and|then|after)\s+/i)[0]?.trim() ?? "";
  const candidate = cleanText(firstClause);

  if (candidate.length >= 6) {
    return sentenceCase(candidate.slice(0, 120));
  }

  return "New intake task";
}

function inferPriority(rawText: string): 1 | 2 | 3 | 4 | 5 | undefined {
  const text = rawText.toLowerCase();

  if (CRITICAL_PRIORITY_HINTS.some((hint) => text.includes(hint))) return 1;
  if (HIGH_PRIORITY_HINTS.some((hint) => text.includes(hint))) return 2;
  if (text.length > 180) return 3;

  return undefined;
}

function parseActionableClauses(rawText: string): string[] {
  return rawText
    .split(SPLIT_REGEX)
    .map((part) => part.replace(CLAUSE_TRIM_REGEX, "").trim())
    .filter((part) => part.length >= 8)
    .slice(0, MAX_RECOMMENDED_SUBTASKS);
}

function hasActionSignal(rawText: string): boolean {
  const text = rawText.toLowerCase();
  return ACTION_VERBS.some((verb) => text.includes(verb));
}

function hasInputSignal(rawText: string): boolean {
  return INPUT_SIGNAL_REGEX.test(rawText);
}

function hasOutputSignal(rawText: string): boolean {
  return OUTPUT_SIGNAL_REGEX.test(rawText);
}

function buildGenericDraftSubtasks(baseTitle: string): MissionDraftSubtask[] {
  return [
    { title: `Clarify scope for: ${baseTitle}`, position: 1, estimatedMinutes: 10 },
    { title: "Break work into concrete implementation steps", position: 2, estimatedMinutes: 15 },
    { title: "Execute first implementation slice", position: 3, estimatedMinutes: 20 },
  ];
}

function toDraftSubtasksFromClauses(clauses: string[]): MissionDraftSubtask[] {
  return clauses.slice(0, MAX_RECOMMENDED_SUBTASKS).map((clause, index) => ({
    title: sentenceCase(clause),
    position: index + 1,
    estimatedMinutes: 10,
  }));
}

function computeConfidence(
  normalized: MissionNormalizedIntakeRequest,
  draftSubtasks: MissionDraftSubtask[],
  warnings: string[],
): MissionIntakeConfidence {
  if (!normalized.rawText || normalized.rawText.length < 20) return "low";
  if (warnings.length >= 2) return "low";
  if (draftSubtasks.length >= MIN_RECOMMENDED_SUBTASKS && warnings.length === 0) return "high";
  return "medium";
}

export function normalizeIntakeRequest(input: MissionRawIntakeRequest): MissionNormalizedIntakeRequest {
  return {
    ...input,
    sourceChannel: input.sourceChannel,
    rawText: cleanText(input.rawText),
    requestedBy: cleanText(input.requestedBy) || undefined,
    requestedByUserId: cleanText(input.requestedByUserId) || undefined,
    requestedAgentName: cleanText(input.requestedAgentName) || undefined,
    requestedAgentId: cleanText(input.requestedAgentId) || undefined,
    sourceMessageId: cleanText(input.sourceMessageId) || undefined,
  };
}

export function suggestDraftSubtasks(
  input: MissionNormalizedIntakeRequest | MissionDraftTaskPayload,
): MissionDraftSubtask[] {
  if ("draftSubtasks" in input) {
    if (input.draftSubtasks.length > 0) {
      return input.draftSubtasks.slice(0, MAX_RECOMMENDED_SUBTASKS).map((subtask, index) => ({
        ...subtask,
        position: index + 1,
      }));
    }

    return buildGenericDraftSubtasks(input.title);
  }

  const clauses = parseActionableClauses(input.rawText);
  if (clauses.length === 0) {
    return buildGenericDraftSubtasks(deriveTitle(input.rawText));
  }

  if (clauses.length < MIN_RECOMMENDED_SUBTASKS && hasActionSignal(input.rawText)) {
    return toDraftSubtasksFromClauses(clauses);
  }

  if (clauses.length >= MIN_RECOMMENDED_SUBTASKS) {
    return toDraftSubtasksFromClauses(clauses);
  }

  return buildGenericDraftSubtasks(deriveTitle(input.rawText));
}

export function createDraftTaskFromIntake(input: MissionRawIntakeRequest): MissionDraftTaskPayload {
  // Deterministic intake layer only. No AI parsing here.
  // Future main-agent/AI planner can enrich this draft before persistence.
  // This output is intended for future POST /api/tasks + POST /api/tasks/:id/subtasks flows.
  const normalized = normalizeIntakeRequest(input);
  const warnings: string[] = [];

  if (!normalized.rawText) {
    warnings.push("Raw intake text is empty.");
  }

  if (normalized.rawText.length < 30) {
    warnings.push("Request looks brief; intake details may be insufficient.");
  }

  if (!hasActionSignal(normalized.rawText)) {
    warnings.push("No clear action verb detected; draft may require clarification.");
  }

  if (!hasInputSignal(normalized.rawText)) {
    warnings.push("Lucy rule: define required input/material before starting the task.");
  }

  if (!hasOutputSignal(normalized.rawText)) {
    warnings.push("Lucy rule: define expected measurable output before starting the task.");
  }

  const draftSubtasks = suggestDraftSubtasks(normalized);

  if (draftSubtasks.length < MIN_RECOMMENDED_SUBTASKS) {
    warnings.push(
      `Draft includes ${draftSubtasks.length} subtasks; recommended range is ${MIN_RECOMMENDED_SUBTASKS}-${MAX_RECOMMENDED_SUBTASKS}.`,
    );
  }

  if (draftSubtasks.length > MAX_RECOMMENDED_SUBTASKS) {
    warnings.push(
      `Draft includes ${draftSubtasks.length} subtasks; recommended maximum is ${MAX_RECOMMENDED_SUBTASKS}.`,
    );
  }

  const title = deriveTitle(normalized.rawText);

  return {
    title,
    description: normalized.rawText,
    sourceChannel: normalized.sourceChannel,
    requestedBy: normalized.requestedBy,
    assignedAgentId: normalized.requestedAgentId,
    priority: inferPriority(normalized.rawText),
    draftSubtasks,
    warnings,
    intakeConfidence: computeConfidence(normalized, draftSubtasks, warnings),
    sourceMessageId: normalized.sourceMessageId,
    sourceContext: normalized.sourceContext,
    createdByAgentId: normalized.createdByAgentId,
  };
}

export function validateDraftTaskIntake(
  draftTask: MissionDraftTaskPayload,
): MissionDraftTaskValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [...draftTask.warnings];

  if (!cleanText(draftTask.title)) {
    errors.push("Title is required.");
  }

  if (!cleanText(draftTask.description)) {
    errors.push("Description is required.");
  }

  if (draftTask.draftSubtasks.length === 0) {
    errors.push("At least one draft subtask is required.");
  }

  if (draftTask.draftSubtasks.length < MIN_RECOMMENDED_SUBTASKS) {
    warnings.push(
      `Subtask count (${draftTask.draftSubtasks.length}) is below recommended minimum (${MIN_RECOMMENDED_SUBTASKS}).`,
    );
  }

  if (draftTask.draftSubtasks.length > MAX_RECOMMENDED_SUBTASKS) {
    warnings.push(
      `Subtask count (${draftTask.draftSubtasks.length}) is above recommended maximum (${MAX_RECOMMENDED_SUBTASKS}).`,
    );
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}
