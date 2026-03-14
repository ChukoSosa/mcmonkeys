import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/api/server/prisma";
import { apiErrorResponse, validationError } from "@/app/api/server/api-error";
import { checkLucyGoldRules } from "@/lib/mission/goldRules";

const TaskIdParamSchema = z.object({
  id: z.string().min(1),
});

const MCLUCY_COMMENT_MARKER = "[mcLucy-flag]";
const OPENCLAW_MAIN_AUTHOR_ID = "main-openclaw-agent";

function getFingerprint(body: string): string | null {
  const match = body.match(/fingerprint:([a-z0-9]+)/i);
  return match?.[1] ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const parsedParams = TaskIdParamSchema.safeParse(await params);
    if (!parsedParams.success) {
      throw validationError(parsedParams.error);
    }

    const { id } = parsedParams.data;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subtasks: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            authorType: true,
            authorId: true,
            body: true,
            status: true,
            resolvedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const check = checkLucyGoldRules({
      title: task.title,
      description: task.description,
      subtaskCount: task._count.subtasks,
    });

    const openFlag = task.comments.find((comment) => {
      if (comment.authorType !== "system") return false;
      if (!comment.body.includes(MCLUCY_COMMENT_MARKER)) return false;
      if (comment.resolvedAt) return false;
      return !["resolved", "answered"].includes(comment.status);
    }) ?? null;

    const fingerprint = openFlag ? getFingerprint(openFlag.body) : null;
    const openClawCleared = openFlag
      ? task.comments.some((comment) => {
          if (comment.authorType !== "agent") return false;
          if (comment.authorId !== OPENCLAW_MAIN_AUTHOR_ID) return false;
          if (comment.createdAt <= openFlag.createdAt) return false;
          if (!fingerprint) return false;
          return comment.body.includes(`[mclucy-clear:${fingerprint}]`);
        })
      : false;

    const humanCommentsAfterFlag = openFlag
      ? task.comments.filter((comment) => {
          if (comment.authorType !== "human") return false;
          return comment.createdAt > openFlag.createdAt;
        }).length
      : 0;

    const metadata =
      task.metadata && typeof task.metadata === "object" && !Array.isArray(task.metadata)
        ? (task.metadata as Record<string, unknown>)
        : {};
    const mcLucyMetadata =
      metadata.mcLucy && typeof metadata.mcLucy === "object" && !Array.isArray(metadata.mcLucy)
        ? (metadata.mcLucy as Record<string, unknown>)
        : null;

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      compliant: check.errors.length === 0,
      checks: check.checks,
      errors: check.errors,
      warnings: check.warnings,
      openFlag: openFlag
        ? {
            commentId: openFlag.id,
            createdAt: openFlag.createdAt.toISOString(),
            fingerprint,
            resolvedByOpenClaw: openClawCleared,
            humanCommentsAfterFlag,
          }
        : null,
      mcLucy: mcLucyMetadata,
      reviewedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
