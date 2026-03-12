import { z } from "zod";

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  status: z.string().optional(),
  statusMessage: z.string().nullable().optional(),
  heartbeat: z.string().nullable().optional(),
  heartbeatAt: z.string().nullable().optional(),
  avatarUrl: z.string().optional(),
  avatar: z
    .union([
      z.string(),
      z.object({
        url: z.string().optional(),
      }).passthrough(),
    ])
    .nullable()
    .optional(),
}).passthrough();

export type Agent = z.infer<typeof AgentSchema>;

export const AgentsResponseSchema = z.object({
  agents: z.array(AgentSchema),
});
