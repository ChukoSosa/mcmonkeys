import {
  createDraftTaskFromIntake,
  normalizeIntakeRequest,
  type MissionDraftTaskPayload,
  type MissionRawIntakeRequest,
} from "@/lib/mission/intake";
import {
  toTaskCreationPlan,
  type MissionTaskCreationPlan,
} from "@/lib/mission/apiPayloads";
import {
  MIN_RECOMMENDED_SUBTASKS,
  MAX_RECOMMENDED_SUBTASKS,
} from "@/lib/mission/decomposition";
import type { MissionTaskCreationExecutionResult } from "@/lib/mission/executor";

export type MissionActionabilityKind =
  | "actionable"
  | "non_actionable"
  | "too_vague"
  | "needs_human_review";

export interface MissionActionabilityAssessment {
  kind: MissionActionabilityKind;
  isActionable: boolean;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  warnings: string[];
}

export type MissionMainAgentDecisionType =
  | "create_task_immediately"
  | "create_draft_task_with_warnings"
  | "ask_for_clarification"
  | "ignore_or_log_only";

export interface MissionMainAgentDecision {
  decision: MissionMainAgentDecisionType;
  assessment: MissionActionabilityAssessment;
  draftTask?: MissionDraftTaskPayload;
  creationPlan?: MissionTaskCreationPlan;
  warnings: string[];
}

export interface MissionMainAgentResponseDraft {
  title: string;
  message: string;
  bulletPoints: string[];
  followUpQuestions?: string[];
  tone: "confirming" | "warning" | "clarifying" | "informational";
}

const NON_ACTIONABLE_PATTERNS = [
  /^(hi|hello|hey)\b/i,
  /^thanks?\b/i,
  /^ok(?:ay)?\b/i,
  /^noted\b/i,
  /^fyi\b/i,
  /^good\s+(morning|afternoon|evening)\b/i,
];

const HUMAN_REVIEW_HINTS = [
  "legal",
  "contract",
  "billing",
  "payment",
  "invoice",
  "security incident",
  "breach",
  "compliance",
  "policy exception",
  "delete production",
];

const ACTION_HINTS = [
  "create",
  "build",
  "implement",
  "fix",
  "update",
  "deploy",
  "design",
  "write",
  "define",
  "integrate",
  "prepare",
  "refactor",
  "review",
  "set up",
  "setup",
];

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function hasActionHint(rawText: string): boolean {
  const text = rawText.toLowerCase();
  return ACTION_HINTS.some((hint) => text.includes(hint));
}

function isNonActionable(rawText: string): boolean {
  const text = cleanText(rawText);
  if (!text) return true;
  return NON_ACTIONABLE_PATTERNS.some((pattern) => pattern.test(text));
}

function needsHumanReview(rawText: string): boolean {
  const text = rawText.toLowerCase();
  return HUMAN_REVIEW_HINTS.some((hint) => text.includes(hint));
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

export function assessActionability(
  input: MissionRawIntakeRequest,
): MissionActionabilityAssessment {
  // Deterministic policy layer only. No AI parsing.
  const normalized = normalizeIntakeRequest(input);
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!normalized.rawText) {
    reasons.push("Incoming request text is empty.");
    return {
      kind: "too_vague",
      isActionable: false,
      confidence: "low",
      reasons,
      warnings,
    };
  }

  if (isNonActionable(normalized.rawText)) {
    reasons.push("Message appears informational or conversational, without task intent.");
    return {
      kind: "non_actionable",
      isActionable: false,
      confidence: "high",
      reasons,
      warnings,
    };
  }

  if (needsHumanReview(normalized.rawText)) {
    reasons.push("Request contains policy-sensitive keywords requiring human review.");
    warnings.push("Human review is recommended before automatic task execution.");
    return {
      kind: "needs_human_review",
      isActionable: false,
      confidence: "medium",
      reasons,
      warnings,
    };
  }

  const brief = normalized.rawText.length < 24;
  const hasAction = hasActionHint(normalized.rawText);

  if (brief && !hasAction) {
    reasons.push("Request is too short and lacks an explicit action signal.");
    warnings.push("Add objective, scope, and expected outcome.");
    return {
      kind: "too_vague",
      isActionable: false,
      confidence: "low",
      reasons,
      warnings,
    };
  }

  reasons.push("Request includes actionable intent suitable for task creation.");

  if (!hasAction) {
    warnings.push("Action verb not explicit; inferred intent may need confirmation.");
  }

  return {
    kind: "actionable",
    isActionable: true,
    confidence: hasAction ? "high" : "medium",
    reasons,
    warnings,
  };
}

export function decideMainAgentFlow(
  input: MissionRawIntakeRequest,
): MissionMainAgentDecision {
  // Intended for future OpenClaw/Telegram handlers and automation workflows.
  const assessment = assessActionability(input);

  if (assessment.kind === "non_actionable") {
    return {
      decision: "ignore_or_log_only",
      assessment,
      warnings: dedupe(assessment.warnings),
    };
  }

  if (assessment.kind === "too_vague" || assessment.kind === "needs_human_review") {
    return {
      decision: "ask_for_clarification",
      assessment,
      warnings: dedupe(assessment.warnings),
    };
  }

  const draftTask = createDraftTaskFromIntake(input);
  const creationPlan = toTaskCreationPlan(draftTask);
  const warnings = dedupe([...assessment.warnings, ...draftTask.warnings, ...creationPlan.warnings]);

  const lowSubtaskCount = creationPlan.subtaskPayloads.length < MIN_RECOMMENDED_SUBTASKS;
  const hasTooManySubtasks = creationPlan.subtaskPayloads.length > MAX_RECOMMENDED_SUBTASKS;

  if (creationPlan.readiness === "ready" && !lowSubtaskCount && !hasTooManySubtasks) {
    return {
      decision: "create_task_immediately",
      assessment,
      draftTask,
      creationPlan,
      warnings,
    };
  }

  return {
    decision: "create_draft_task_with_warnings",
    assessment,
    draftTask,
    creationPlan,
    warnings,
  };
}

export function buildMainAgentResponseDraft(
  decision: MissionMainAgentDecision,
  executionResult?: MissionTaskCreationExecutionResult,
): MissionMainAgentResponseDraft {
  const warnings = dedupe(decision.warnings);

  if (decision.decision === "ignore_or_log_only") {
    return {
      title: "No task created",
      message: "This message appears non-actionable, so it was logged without creating a task.",
      bulletPoints: [
        "No executable work item detected.",
        "You can send a specific action request to create a task.",
      ],
      tone: "informational",
    };
  }

  if (decision.decision === "ask_for_clarification") {
    return {
      title: "Clarification needed",
      message: "I need more details before creating a reliable task in MC LUCY.",
      bulletPoints: warnings.length > 0 ? warnings : ["The request is currently too ambiguous."],
      followUpQuestions: [
        "What is the concrete objective?",
        "What is the expected output or done criteria?",
        "Who should own this task?",
      ],
      tone: "clarifying",
    };
  }

  if (decision.decision === "create_draft_task_with_warnings") {
    return {
      title: "Draft task prepared with warnings",
      message: "I prepared a draft task, but it should be reviewed before full execution.",
      bulletPoints: warnings.length > 0 ? warnings : ["Review the draft title, scope, and subtasks."],
      tone: "warning",
    };
  }

  if (executionResult) {
    if (executionResult.stage === "subtasks_created" && executionResult.success) {
      return {
        title: "Task created successfully",
        message: "The task and subtasks were created in MC LUCY.",
        bulletPoints: [
          `Task ID: ${executionResult.taskId ?? "n/a"}`,
          `Subtasks created: ${executionResult.subtasksCreatedCount}`,
        ],
        tone: "confirming",
      };
    }

    if (executionResult.stage === "partial_failure") {
      return {
        title: "Task created with partial subtask failures",
        message: "The task was created, but some subtasks failed and need follow-up.",
        bulletPoints: [
          `Task ID: ${executionResult.taskId ?? "n/a"}`,
          `Subtasks created: ${executionResult.subtasksCreatedCount}`,
          ...executionResult.errors.slice(0, 3),
        ],
        tone: "warning",
      };
    }
  }

  return {
    title: "Task ready for creation",
    message: "This request is actionable and can be created in MC LUCY.",
    bulletPoints: warnings.length > 0 ? warnings : ["No policy warnings detected."],
    tone: "confirming",
  };
}
