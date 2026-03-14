import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  taskUpdateMock: vi.fn(),
  taskCommentCreateMock: vi.fn(),
  taskCommentUpdateMock: vi.fn(),
  activityLogMock: vi.fn(),
  taskServiceUpdateMock: vi.fn(),
}));

vi.mock("@/app/api/server/prisma", () => ({
  prisma: {
    task: {
      findMany: mocks.findManyMock,
      update: mocks.taskUpdateMock,
    },
    taskComment: {
      create: mocks.taskCommentCreateMock,
      update: mocks.taskCommentUpdateMock,
    },
  },
}));

vi.mock("@/app/api/server/activity-service", () => ({
  activityService: {
    log: mocks.activityLogMock,
  },
}));

vi.mock("@/app/api/server/task-service", () => ({
  taskService: {
    update: mocks.taskServiceUpdateMock,
  },
}));

import {
  listActiveBacklogFlags,
  runBacklogHealthReview,
} from "@/app/api/server/backlog-health-review";

describe("backlog-health-review", () => {
  beforeEach(() => {
    mocks.findManyMock.mockReset();
    mocks.taskUpdateMock.mockReset();
    mocks.taskCommentCreateMock.mockReset();
    mocks.taskCommentUpdateMock.mockReset();
    mocks.activityLogMock.mockReset();
    mocks.taskServiceUpdateMock.mockReset();
  });

  it("creates flags in dry-run report for non-compliant backlog tasks", async () => {
    mocks.findManyMock.mockResolvedValueOnce([
      {
        id: "task-1",
        title: "Pricing flow",
        description: "Task missing explicit sections",
        status: "BACKLOG",
        metadata: {},
        _count: { subtasks: 2 },
        comments: [],
      },
    ]);

    const result = await runBacklogHealthReview({ dryRun: true, limit: 10 });

    expect(result.processed).toBe(1);
    expect(result.flaggedCreated).toBe(1);
    expect(result.tasks[0]?.action).toBe("flag_created");
    expect(result.tasks[0]?.errors.length).toBeGreaterThan(0);
    expect(mocks.taskCommentCreateMock).not.toHaveBeenCalled();
  });

  it("lists only active open flags", async () => {
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60_000);

    mocks.findManyMock.mockResolvedValueOnce([
      {
        id: "task-flagged",
        title: "Public Demo Polish",
        description: "Input: Existing visual hierarchy. Output: Updated contrast checklist.",
        status: "BACKLOG",
        _count: { subtasks: 2 },
        comments: [
          {
            id: "comment-open",
            authorType: "system",
            authorId: "mclucy-guardian",
            body: "[mcLucy-flag] fingerprint:abc123",
            status: "open",
            resolvedAt: null,
            createdAt: twentyMinutesAgo,
          },
        ],
      },
      {
        id: "task-resolved",
        title: "Resolved task",
        description: "Input: X\nOutput: Y",
        status: "BACKLOG",
        _count: { subtasks: 2 },
        comments: [
          {
            id: "comment-resolved",
            authorType: "system",
            authorId: "mclucy-guardian",
            body: "[mcLucy-flag] fingerprint:def456",
            status: "resolved",
            resolvedAt: now,
            createdAt: twentyMinutesAgo,
          },
        ],
      },
    ]);

    const flags = await listActiveBacklogFlags();

    expect(flags).toHaveLength(1);
    expect(flags[0]?.taskId).toBe("task-flagged");
    expect(flags[0]?.fingerprint).toBe("abc123");
    expect(flags[0]?.timedOut).toBe(false);
  });
});
