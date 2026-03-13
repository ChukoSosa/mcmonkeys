import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/api/server/prisma";
import { apiErrorResponse } from "@/app/api/server/api-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const subtasks = await prisma.subtask.findMany({
      where: { taskId: id },
      include: {
        ownerAgent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ subtasks });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json() as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const status =
      typeof body.status === "string" &&
      ["TODO", "DOING", "DONE", "BLOCKED"].includes(body.status.toUpperCase())
        ? (body.status.toUpperCase() as "TODO" | "DOING" | "DONE" | "BLOCKED")
        : ("TODO" as const);

    const position = typeof body.position === "number" ? body.position : 0;

    const ownerAgentId =
      typeof body.ownerAgentId === "string" && body.ownerAgentId.trim()
        ? body.ownerAgentId.trim()
        : undefined;

    const subtask = await prisma.subtask.create({
      data: {
        title,
        status,
        position,
        taskId: id,
        ownerAgentId,
      },
      include: {
        ownerAgent: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
