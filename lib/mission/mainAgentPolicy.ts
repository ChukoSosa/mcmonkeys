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
    warnings.push("Este tipo de solicitud necesita revisión manual antes de ejecutarse automáticamente.");
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
    warnings.push("Agregá el objetivo, alcance y resultado esperado.");
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
    warnings.push("No detecté un verbo de acción claro — si podés incluir qué debe hacerse (crear, implementar, revisar…) sería mejor.");
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
      title: "Nada para hacer por ahora",
      message: "Vi tu mensaje y lo registré, pero parece informativo — no encontré ninguna acción concreta para convertirlo en tarea.",
      bulletPoints: [
        "Cuando quieras crear algo, describí la acción con verbos como crear, implementar, revisar, configurar, etc.",
      ],
      tone: "informational",
    };
  }

  if (decision.decision === "ask_for_clarification") {
    return {
      title: "Cuéntame un poco más",
      message: "Recibí tu mensaje pero necesito más detalle para crear la tarea correctamente. Respondé estas preguntas:",
      bulletPoints: warnings.length > 0 ? warnings : ["El pedido es ambiguo sin más contexto."],
      followUpQuestions: [
        "¿Cuál es el objetivo concreto?",
        "¿Cuál es el resultado esperado o criterio de completitud?",
        "¿Quién debería encargarse de esto?",
      ],
      tone: "clarifying",
    };
  }

  if (decision.decision === "create_draft_task_with_warnings") {
    return {
      title: "Borrador listo — revisá estos puntos",
      message: "Armé una tarea en borrador basada en tu mensaje. Hay algunas cosas para revisar antes de ejecutarla:",
      bulletPoints: warnings.length > 0 ? warnings : ["Revisá el título, alcance y subtareas del borrador."],
      tone: "warning",
    };
  }

  if (executionResult) {
    if (executionResult.stage === "subtasks_created" && executionResult.success) {
      return {
        title: "¡Tarea creada exitosamente!",
        message: "La tarea y sus subtareas fueron creadas en MC LUCY.",
        bulletPoints: [
          `ID de tarea: ${executionResult.taskId ?? "n/a"}`,
          `Subtareas creadas: ${executionResult.subtasksCreatedCount}`,
        ],
        tone: "confirming",
      };
    }

    if (executionResult.stage === "partial_failure") {
      return {
        title: "Tarea creada con errores parciales",
        message: "La tarea se creó, pero algunas subtareas fallaron y necesitan seguimiento.",
        bulletPoints: [
          `ID de tarea: ${executionResult.taskId ?? "n/a"}`,
          `Subtareas creadas: ${executionResult.subtasksCreatedCount}`,
          ...executionResult.errors.slice(0, 3),
        ],
        tone: "warning",
      };
    }
  }

  return {
    title: "Tarea lista para crear",
    message: "El pedido es válido y puede procesarse en MC LUCY.",
    bulletPoints: warnings.length > 0 ? warnings : ["Sin advertencias detectadas."],
    tone: "confirming",
  };
}
