import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isLocalDevMockMode } from "@/app/api/server/demo-mode";
import { localDevMockStore } from "@/lib/mock/store";
import { agentService } from "@/app/api/server/agent-service";
import { taskService } from "@/app/api/server/task-service";
import { z } from "zod";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1),
});

const MCLUCY_SYSTEM_PROMPT = `Sos mcLucy, la Chief of Operations del Mission Control. Tu trabajo es coordinar el equipo, gestionar el board de tareas y mantener todo funcionando.

Personalidad: directa, informada, confiable. Hablás en español rioplatense informal. Sabés exactamente qué está pasando en cada momento.

Tenés acceso a:
- Lista de agentes y su estado actual
- Todas las tareas del board (BACKLOG, IN_PROGRESS, REVIEW, DONE, BLOCKED)
- Crear tareas con subtareas
- Mover tareas entre estados
- Asignar tareas a agentes
- Dejar comentarios en tareas

Cuando te pidan crear una tarea, usá el tool create_task. Siempre proponé al menos 2-3 subtareas concretas.
Cuando te pregunten sobre el estado del board o de un agente, consultá los datos reales con los tools antes de responder.
Sé concisa y al punto. No uses bullets ni listas largas salvo que sea necesario.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "list_agents",
    description: "Lista todos los agentes disponibles con su estado actual y tarea en curso",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_tasks",
    description: "Lista las tareas del board, con filtros opcionales por estado o agente",
    input_schema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"],
          description: "Filtrar por estado (opcional)",
        },
        assignedAgentId: {
          type: "string",
          description: "Filtrar por ID de agente asignado (opcional)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_task",
    description: "Crea una nueva tarea en el board con subtareas",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Título claro y conciso de la tarea" },
        description: {
          type: "string",
          description: "Descripción detallada con contexto, inputs necesarios y outputs esperados",
        },
        priority: { type: "number", description: "Prioridad del 1 (alta) al 5 (baja)", minimum: 1, maximum: 5 },
        assignedAgentId: { type: "string", description: "ID del agente al que asignar (opcional)" },
        subtasks: {
          type: "array",
          items: { type: "string" },
          description: "Lista de subtareas (mínimo 2, máximo 5)",
          minItems: 2,
          maxItems: 5,
        },
      },
      required: ["title", "description", "subtasks"],
    },
  },
  {
    name: "update_task_status",
    description: "Mueve una tarea a un nuevo estado en el board",
    input_schema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "ID de la tarea" },
        status: {
          type: "string",
          enum: ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"],
          description: "Nuevo estado",
        },
      },
      required: ["taskId", "status"],
    },
  },
  {
    name: "assign_task",
    description: "Asigna una tarea a un agente específico",
    input_schema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "ID de la tarea" },
        agentId: { type: "string", description: "ID del agente" },
      },
      required: ["taskId", "agentId"],
    },
  },
  {
    name: "add_comment",
    description: "Agrega un comentario a una tarea",
    input_schema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "ID de la tarea" },
        body: { type: "string", description: "Texto del comentario" },
      },
      required: ["taskId", "body"],
    },
  },
];

async function executeTool(toolName: string, toolInput: Record<string, unknown>): Promise<unknown> {
  if (isLocalDevMockMode()) {
    return executeToolMock(toolName, toolInput);
  }
  return executeToolReal(toolName, toolInput);
}

async function executeToolMock(toolName: string, toolInput: Record<string, unknown>): Promise<unknown> {
  switch (toolName) {
    case "list_agents": {
      return localDevMockStore.listAgents();
    }
    case "list_tasks": {
      let tasks = localDevMockStore.listTasks(false);
      if (toolInput.status) {
        tasks = tasks.filter((t) => t.status === toolInput.status);
      }
      if (toolInput.assignedAgentId) {
        tasks = tasks.filter((t) => t.assignedAgentId === toolInput.assignedAgentId);
      }
      return tasks;
    }
    case "create_task": {
      const task = localDevMockStore.createTask({
        title: toolInput.title as string,
        description: toolInput.description as string,
        assignedAgentId: toolInput.assignedAgentId as string | undefined,
        priority: toolInput.priority as number | undefined,
        status: "BACKLOG",
      });
      const subtasks = toolInput.subtasks as string[];
      const createdSubtasks = subtasks.map((title, i) =>
        localDevMockStore.createSubtask(task.id, { title, position: i }),
      );
      return { task, subtasks: createdSubtasks };
    }
    case "update_task_status": {
      return localDevMockStore.updateTask(toolInput.taskId as string, {
        status: toolInput.status as string,
      });
    }
    case "assign_task": {
      return localDevMockStore.updateTask(toolInput.taskId as string, {
        assignedAgentId: toolInput.agentId as string,
      });
    }
    case "add_comment": {
      return localDevMockStore.createComment(toolInput.taskId as string, {
        body: toolInput.body as string,
        authorType: "system",
        authorId: "mclucy-chief",
        status: "open",
        requiresResponse: false,
        inReplyToId: null,
      });
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function executeToolReal(toolName: string, toolInput: Record<string, unknown>): Promise<unknown> {
  switch (toolName) {
    case "list_agents": {
      return agentService.list();
    }
    case "list_tasks": {
      const { tasks } = await taskService.list({
        status: toolInput.status as string | undefined,
        assignedAgentId: toolInput.assignedAgentId as string | undefined,
      });
      return tasks;
    }
    case "create_task": {
      const task = await taskService.create({
        title: toolInput.title as string,
        description: toolInput.description as string,
        assignedAgentId: toolInput.assignedAgentId as string | undefined,
        priority: toolInput.priority as number | undefined,
        status: "BACKLOG",
      });
      return { task, subtasks: [] };
    }
    case "update_task_status": {
      return taskService.update(toolInput.taskId as string, {
        status: toolInput.status as string,
      });
    }
    case "assign_task": {
      return taskService.update(toolInput.taskId as string, {
        assignedAgentId: toolInput.agentId as string,
      });
    }
    case "add_comment": {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"}/api/tasks/${toolInput.taskId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: toolInput.body,
            authorType: "system",
            authorId: "mclucy-chief",
          }),
        },
      );
      return response.json();
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
    }

    const { messages } = parsed.data;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function send(data: object) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        }

        try {
          let currentMessages: Anthropic.MessageParam[] = messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));

          // Agentic loop: keep going until stop_reason is "end_turn"
          while (true) {
            const response = await client.messages.create({
              model: "claude-sonnet-4-6",
              max_tokens: 2048,
              system: MCLUCY_SYSTEM_PROMPT,
              tools: TOOLS,
              messages: currentMessages,
              stream: true,
            });

            let fullText = "";
            let inputJson = "";
            let currentToolName = "";
            let currentToolUseId = "";
            const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
            let stopReason: string | null = null;

            for await (const event of response) {
              if (event.type === "content_block_start") {
                if (event.content_block.type === "tool_use") {
                  currentToolName = event.content_block.name;
                  currentToolUseId = event.content_block.id;
                  inputJson = "";
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta.type === "text_delta") {
                  fullText += event.delta.text;
                  send({ type: "text", text: event.delta.text });
                } else if (event.delta.type === "input_json_delta") {
                  inputJson += event.delta.partial_json;
                }
              } else if (event.type === "content_block_stop") {
                if (currentToolName) {
                  let toolInput: Record<string, unknown> = {};
                  try {
                    toolInput = JSON.parse(inputJson);
                  } catch {}

                  toolUseBlocks.push({
                    type: "tool_use",
                    id: currentToolUseId,
                    name: currentToolName,
                    input: toolInput,
                  });

                  send({ type: "tool_start", tool: currentToolName, input: toolInput });
                  currentToolName = "";
                  inputJson = "";
                  currentToolUseId = "";
                }
              } else if (event.type === "message_delta") {
                stopReason = event.delta.stop_reason ?? null;
              }
            }

            if (toolUseBlocks.length === 0 || stopReason === "end_turn") {
              break;
            }

            // Execute all tools and prepare tool_result messages
            const assistantContent: Anthropic.ContentBlock[] = [];
            if (fullText) {
              assistantContent.push({ type: "text", text: fullText });
            }
            assistantContent.push(...toolUseBlocks);

            currentMessages = [
              ...currentMessages,
              { role: "assistant", content: assistantContent },
            ];

            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const toolBlock of toolUseBlocks) {
              const result = await executeTool(toolBlock.name, toolBlock.input as Record<string, unknown>);
              send({ type: "tool_result", tool: toolBlock.name, result });
              toolResults.push({
                type: "tool_result",
                tool_use_id: toolBlock.id,
                content: JSON.stringify(result),
              });
            }

            currentMessages = [
              ...currentMessages,
              { role: "user", content: toolResults },
            ];
          }

          send({ type: "done" });
        } catch (err) {
          const errObj = err as Record<string, unknown>;
          const rawMessage = err instanceof Error ? err.message : "Unknown error";
          // Extract clean message from Anthropic error structure
          const anthropicMsg = (errObj?.error as Record<string, unknown> | undefined)?.message;
          const cleanMessage = typeof anthropicMsg === "string" ? anthropicMsg : rawMessage;
          console.error("[mclucy] error:", rawMessage);
          send({ type: "error", message: cleanMessage });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
