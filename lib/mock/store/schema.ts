import { z } from "zod";
import {
  ActivityItemSchema,
  AgentSchema,
  CommentSchema,
  SubtaskSchema,
  TaskSchema,
} from "@/lib/schemas";

export const StoredSubtaskSchema = SubtaskSchema.extend({
  taskId: z.string(),
  ownerAgentId: z.string().nullable().optional(),
});

export const MockStoreSchema = z.object({
  version: z.number(),
  lastResetAt: z.string(),
  counters: z.object({
    task: z.number().int().nonnegative(),
    subtask: z.number().int().nonnegative(),
    comment: z.number().int().nonnegative(),
    activity: z.number().int().nonnegative(),
  }),
  agents: z.array(AgentSchema),
  tasks: z.array(TaskSchema),
  subtasks: z.array(StoredSubtaskSchema),
  comments: z.array(CommentSchema),
  activities: z.array(ActivityItemSchema),
});

export type StoredSubtask = z.infer<typeof StoredSubtaskSchema>;
export type MockStoreState = z.infer<typeof MockStoreSchema>;
