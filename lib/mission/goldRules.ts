export const GOLD_RULES_MIN_SUBTASKS = 2;
export const GOLD_RULES_NICE_TO_HAVE_MAX_SUBTASKS = 5;

export interface LucyGoldRulesCheckInput {
  title: string;
  description: string;
  subtaskCount: number;
}

export interface LucyGoldRulesCheckResult {
  errors: string[];
  warnings: string[];
  checks: {
    hasClearTitle: boolean;
    hasRequiredSubtasks: boolean;
    hasClearOutput: boolean;
    hasClearInput: boolean;
  };
}

const WEAK_TITLES = new Set([
  "task",
  "new task",
  "new intake task",
  "tarea",
  "sin titulo",
  "pendiente",
  "todo",
]);

const INPUT_SECTION_REGEX =
  /(?:^|\n)\s*(?:input|inputs|insumo|insumos|material|materiales|dependencia|dependencias|prerequisito|prerequisitos)\s*[:\-]\s*(.+)/i;
const OUTPUT_SECTION_REGEX =
  /(?:^|\n)\s*(?:output|outputs|resultado esperado|resultado|entregable|evidencia|criterio de completitud|criterio de done)\s*[:\-]\s*(.+)/i;

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function isClearTitle(title: string): boolean {
  const text = cleanText(title).toLowerCase();
  if (!text || text.length < 8) return false;
  if (WEAK_TITLES.has(text)) return false;
  return text.split(" ").length >= 2;
}

function hasClearSection(description: string, regex: RegExp): boolean {
  const match = description.match(regex);
  const candidate = cleanText(match?.[1]);
  return candidate.length >= 10;
}

export function checkLucyGoldRules(input: LucyGoldRulesCheckInput): LucyGoldRulesCheckResult {
  const normalizedTitle = cleanText(input.title);
  const normalizedDescription = input.description ?? "";

  const hasClearTitle = isClearTitle(normalizedTitle);
  const hasRequiredSubtasks = input.subtaskCount >= GOLD_RULES_MIN_SUBTASKS;
  const hasClearInput = hasClearSection(normalizedDescription, INPUT_SECTION_REGEX);
  const hasClearOutput = hasClearSection(normalizedDescription, OUTPUT_SECTION_REGEX);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!hasClearTitle) {
    errors.push("Regla de oro 1: la task debe tener un titulo claro y especifico.");
  }

  if (!hasRequiredSubtasks) {
    errors.push(
      `Regla de oro 2: la task debe tener minimo ${GOLD_RULES_MIN_SUBTASKS} subtasks antes de empezar.`,
    );
  }

  if (!hasClearOutput) {
    errors.push(
      "Regla de oro 3: antes de empezar, debe quedar documentado un output esperado claro y medible (seccion 'Output:').",
    );
  }

  if (!hasClearInput) {
    errors.push(
      "Regla de oro 4: antes de empezar, debe quedar documentado el input/material necesario (seccion 'Input:').",
    );
  }

  if (input.subtaskCount > GOLD_RULES_NICE_TO_HAVE_MAX_SUBTASKS) {
    warnings.push(
      `Regla de oro 2 (nice to have): idealmente mantener entre ${GOLD_RULES_MIN_SUBTASKS} y ${GOLD_RULES_NICE_TO_HAVE_MAX_SUBTASKS} subtasks.`,
    );
  }

  return {
    errors,
    warnings,
    checks: {
      hasClearTitle,
      hasRequiredSubtasks,
      hasClearOutput,
      hasClearInput,
    },
  };
}
