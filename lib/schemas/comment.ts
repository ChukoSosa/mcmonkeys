import { z } from "zod";

export const CommentSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  authorType: z.enum(["agent", "human", "system"]),
  authorId: z.string().nullable().optional(),
  body: z.string(),
  requiresResponse: z.boolean().optional(),
  status: z.string().optional(), // "open" | "answered" | "resolved"
  inReplyToId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  resolvedAt: z.string().nullable().optional(),
});

export type Comment = z.infer<typeof CommentSchema>;

export const CommentsResponseSchema = z.object({
  comments: z.array(CommentSchema),
  nextCursor: z.string().nullable().optional(),
  openCount: z.number().optional(),
});
