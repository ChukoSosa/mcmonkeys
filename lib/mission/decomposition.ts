import type { MissionSubtask, MissionTaskDetail } from "@/types/mission";

export const MIN_RECOMMENDED_SUBTASKS = 2;
export const MAX_RECOMMENDED_SUBTASKS = 5;

export const MIN_RECOMMENDED_SUBTASK_MINUTES = 5;
export const MAX_RECOMMENDED_SUBTASK_MINUTES = 20;

export type MissionDecompositionRecommendationLevel = "good" | "warning" | "critical";

export interface MissionTaskDecompositionOptions {
  // Future-compatible duration source. API does not expose this yet.
  getEstimatedSubtaskMinutes?: (subtask: MissionSubtask) => number | null | undefined;
  estimatedMinutesBySubtaskId?: Record<string, number | null | undefined>;
}

export interface MissionTaskDecompositionResult {
  isUnderDecomposed: boolean;
  isOverDecomposed: boolean;
  isWithinRecommendedRange: boolean;
  subtaskCount: number;
  warnings: string[];
  recommendationLevel: MissionDecompositionRecommendationLevel;
  durationInsights: {
    hasDurationData: boolean;
    estimatedSubtasksCount: number;
    tooShortCount: number;
    tooLongCount: number;
  };
}

function resolveEstimatedMinutes(
  subtask: MissionSubtask,
  options?: MissionTaskDecompositionOptions,
): number | null {
  const fromMap = options?.estimatedMinutesBySubtaskId?.[subtask.id];
  if (typeof fromMap === "number" && Number.isFinite(fromMap) && fromMap > 0) {
    return fromMap;
  }

  const fromResolver = options?.getEstimatedSubtaskMinutes?.(subtask);
  if (typeof fromResolver === "number" && Number.isFinite(fromResolver) && fromResolver > 0) {
    return fromResolver;
  }

  return null;
}

export function hasRecommendedSubtaskCount(taskDetail: MissionTaskDetail): boolean {
  const count = taskDetail.subtasks.length;
  return count >= MIN_RECOMMENDED_SUBTASKS && count <= MAX_RECOMMENDED_SUBTASKS;
}

export function evaluateTaskDecomposition(
  taskDetail: MissionTaskDetail,
  options?: MissionTaskDecompositionOptions,
): MissionTaskDecompositionResult {
  const subtaskCount = taskDetail.subtasks.length;
  const isUnderDecomposed = subtaskCount < MIN_RECOMMENDED_SUBTASKS;
  const isOverDecomposed = subtaskCount > MAX_RECOMMENDED_SUBTASKS;
  const isWithinRecommendedRange = !isUnderDecomposed && !isOverDecomposed;

  const warnings: string[] = [];

  if (isUnderDecomposed) {
    warnings.push(
      `Task has ${subtaskCount} subtasks; recommended minimum is ${MIN_RECOMMENDED_SUBTASKS}.`,
    );
  }

  if (isOverDecomposed) {
    warnings.push(
      `Task has ${subtaskCount} subtasks; recommended maximum is ${MAX_RECOMMENDED_SUBTASKS}.`,
    );
  }

  let estimatedSubtasksCount = 0;
  let tooShortCount = 0;
  let tooLongCount = 0;

  for (const subtask of taskDetail.subtasks) {
    const minutes = resolveEstimatedMinutes(subtask, options);
    if (minutes == null) continue;

    estimatedSubtasksCount += 1;

    if (minutes < MIN_RECOMMENDED_SUBTASK_MINUTES) {
      tooShortCount += 1;
    }

    if (minutes > MAX_RECOMMENDED_SUBTASK_MINUTES) {
      tooLongCount += 1;
    }
  }

  if (tooShortCount > 0) {
    warnings.push(
      `${tooShortCount} subtask(s) are estimated under ${MIN_RECOMMENDED_SUBTASK_MINUTES} minutes.`,
    );
  }

  if (tooLongCount > 0) {
    warnings.push(
      `${tooLongCount} subtask(s) are estimated above ${MAX_RECOMMENDED_SUBTASK_MINUTES} minutes.`,
    );
  }

  let recommendationLevel: MissionDecompositionRecommendationLevel = "good";
  if (warnings.length > 0) {
    recommendationLevel = "warning";
  }

  if (subtaskCount === 0 || subtaskCount < Math.ceil(MIN_RECOMMENDED_SUBTASKS / 2)) {
    recommendationLevel = "critical";
  }

  return {
    isUnderDecomposed,
    isOverDecomposed,
    isWithinRecommendedRange,
    subtaskCount,
    warnings,
    recommendationLevel,
    durationInsights: {
      hasDurationData: estimatedSubtasksCount > 0,
      estimatedSubtasksCount,
      tooShortCount,
      tooLongCount,
    },
  };
}

export function getTaskDecompositionSummary(
  taskDetail: MissionTaskDetail,
  options?: MissionTaskDecompositionOptions,
): string {
  const result = evaluateTaskDecomposition(taskDetail, options);

  if (result.recommendationLevel === "good") {
    return `Task decomposition is healthy (${result.subtaskCount} subtasks).`;
  }

  if (result.warnings.length === 0) {
    return `Task decomposition needs attention (${result.subtaskCount} subtasks).`;
  }

  return `${result.warnings[0]} (${result.subtaskCount} subtasks total).`;
}
