import { z } from "zod";

export const AssignedAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const PipelineStageRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().optional(),
  pipelineId: z.string().optional(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string().optional(),
  priority: z.number().nullable().optional(),
  assignedAgent: AssignedAgentSchema.nullable().optional(),
  assignedAgentId: z.string().nullable().optional(),
  ownerAgentId: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
  description: z.string().nullable().optional(),
  archivedAt: z.string().nullable().optional(),
  pipelineStageId: z.string().nullable().optional(),
  pipelineStage: PipelineStageRefSchema.nullable().optional(),
}).passthrough();

export type Task = z.infer<typeof TaskSchema>;
export type AssignedAgent = z.infer<typeof AssignedAgentSchema>;
export type PipelineStageRef = z.infer<typeof PipelineStageRefSchema>;

export const TasksResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

export const TaskValidationStateSchema = z.object({
  taskId: z.string(),
  status: z.string(),
  compliant: z.boolean(),
  checks: z.object({
    hasClearTitle: z.boolean(),
    hasRequiredSubtasks: z.boolean(),
    hasClearOutput: z.boolean(),
    hasClearInput: z.boolean(),
  }),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  openFlag: z
    .object({
      commentId: z.string(),
      createdAt: z.string(),
      fingerprint: z.string().nullable(),
      resolvedByOpenClaw: z.boolean(),
      humanCommentsAfterFlag: z.number(),
    })
    .nullable(),
  mcLucy: z.record(z.string(), z.unknown()).nullable(),
  reviewedAt: z.string(),
});

export type TaskValidationState = z.infer<typeof TaskValidationStateSchema>;

export const ValidationFlagItemSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  taskStatus: z.string(),
  flagCommentId: z.string(),
  fingerprint: z.string().nullable(),
  flaggedAt: z.string(),
  ageMinutes: z.number(),
  awaitingHumanInput: z.boolean(),
  timedOut: z.boolean(),
  errors: z.array(z.string()),
});

export const ValidationFlagsResponseSchema = z.object({
  total: z.number(),
  flags: z.array(ValidationFlagItemSchema),
  updatedAt: z.string(),
});

export type ValidationFlagItem = z.infer<typeof ValidationFlagItemSchema>;
