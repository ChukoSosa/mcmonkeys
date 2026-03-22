"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faClock, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { faBoxArchive } from "@fortawesome/free-solid-svg-icons";
import { getTasks, getTaskSubtasks, getTaskComments, addTaskComment } from "@/lib/api/tasks";
import { archiveTask } from "@/lib/api/tasks";
import { updateSubtaskStatus } from "@/lib/api/tasks";
import { useDashboardStore } from "@/store/dashboardStore";
import { Card, StatusBadge, SkeletonList, EmptyState, ErrorMessage } from "@/components/ui";
import { fromNow } from "@/lib/utils/formatDate";
import { priorityLabel, priorityVariant } from "@/lib/utils/formatStatus";
import { isPublicDemoMode } from "@/lib/utils/demoMode";
import type { Comment, Subtask } from "@/lib/schemas";

const AUTHOR_STYLE: Record<string, string> = {
  agent: "rounded px-1.5 py-0.5 bg-purple-900/50 text-purple-300",
  human: "rounded px-1.5 py-0.5 bg-emerald-900/50 text-emerald-300",
  system: "rounded px-1.5 py-0.5 bg-slate-700/50 text-slate-400",
};

const SUBTASK_STATUS_FLOW = ["TODO", "DOING", "DONE", "BLOCKED"] as const;

function getNextSubtaskStatus(current?: string | null): (typeof SUBTASK_STATUS_FLOW)[number] {
  const normalized = (current ?? "").toUpperCase();
  const currentIndex = SUBTASK_STATUS_FLOW.indexOf(normalized as (typeof SUBTASK_STATUS_FLOW)[number]);
  if (currentIndex === -1) return "DOING";
  return SUBTASK_STATUS_FLOW[(currentIndex + 1) % SUBTASK_STATUS_FLOW.length];
}

// ─── Main-agent structured comment renderer ──────────────────────────────────

function parseMainAgentComment(body: string) {
  const lines = body.split("\n");
  const rawTitle = lines[0] ?? "";
  const title = rawTitle.startsWith("[Main] ") ? rawTitle.slice(7) : rawTitle;

  const message: string[] = [];
  const bullets: string[] = [];
  const questions: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("• ")) bullets.push(line.slice(2));
    else if (line.startsWith("? ")) questions.push(line.slice(2));
    else if (line.trim()) message.push(line);
  }

  return { title, message: message.join(" "), bullets, questions };
}

const MAIN_TOOLTIPS: Array<{ match: RegExp; tip: string }> = [
  {
    match: /nada para hacer|registrado/i,
    tip: "Main analizó tu mensaje y no encontró ninguna acción concreta para crear como tarea. Cuando quieras crear algo, describí qué debe hacerse.",
  },
  {
    match: /cu[eé]ntame|m[aá]s info|m[aá]s detalle/i,
    tip: "Main recibió tu mensaje pero necesita más contexto para armar la tarea bien. Respondé las preguntas para que pueda continuar.",
  },
  {
    match: /borrador|revis[aá]/i,
    tip: "Main preparó un borrador basado en tu mensaje, pero encontró puntos a revisar antes de ejecutarlo. Corregí lo que necesites y confirmá.",
  },
  {
    match: /tarea creada exitosamente/i,
    tip: "Main procesó tu solicitud con éxito y creó la tarea en MC-MONKEYS.",
  },
  {
    match: /errores parciales/i,
    tip: "La tarea fue creada pero algunas subtareas fallaron. Revisá los detalles para hacer seguimiento.",
  },
  {
    match: /lista para crear/i,
    tip: "Main validó tu solicitud y puede crear la tarea en MC-MONKEYS.",
  },
];

function getMainTooltip(title: string): string {
  const entry = MAIN_TOOLTIPS.find((t) => t.match.test(title));
  return entry?.tip ?? "Respuesta automática del agente Main de MC-MONKEYS.";
}

const TONE_TITLE_STYLE: Record<string, string> = {
  "nada": "text-slate-300",
  "cuéntame": "text-amber-300",
  "borrador": "text-amber-300",
  "creada": "text-emerald-300",
  "errores": "text-rose-300",
  "lista": "text-cyan-300",
};

function getMainTitleColor(title: string): string {
  const t = title.toLowerCase();
  for (const [key, cls] of Object.entries(TONE_TITLE_STYLE)) {
    if (t.includes(key)) return cls;
  }
  return "text-purple-300";
}

function MainAgentBubble({ body }: { body: string }) {
  const { title, message, bullets, questions } = parseMainAgentComment(body);
  const tooltip = getMainTooltip(title);
  const titleColor = getMainTitleColor(title);

  return (
    <div>
      {/* Header row: label + title + tooltip */}
      <div className="flex items-start gap-1.5 mb-1.5 flex-wrap">
        <span className="rounded px-1.5 py-0.5 bg-purple-900/50 text-purple-300 text-[10px] font-medium shrink-0">
          Main
        </span>
        <span className={`text-xs font-semibold leading-snug ${titleColor}`}>{title}</span>
        {/* Tooltip trigger */}
        <div className="relative group/tip flex-shrink-0 self-center">
          <button
            type="button"
            className="w-4 h-4 rounded-full bg-slate-700 text-slate-400 text-[9px] font-bold flex items-center justify-center hover:bg-slate-600 hover:text-slate-200 transition-colors"
            aria-label="Qué significa esto"
          >
            ?
          </button>
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 rounded bg-slate-900 border border-surface-600 px-3 py-2 text-[11px] text-slate-300 leading-snug opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-xl">
            <p className="font-semibold text-slate-200 mb-1">¿Qué significa esto?</p>
            {tooltip}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <p className="text-xs text-slate-300 leading-snug">{message}</p>
      )}

      {/* Bullet points */}
      {bullets.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-slate-400 leading-snug">
              <span className="text-surface-600 mt-0.5 shrink-0">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Follow-up questions */}
      {questions.length > 0 && (
        <div className="mt-2 rounded border border-amber-800/40 bg-amber-950/20 px-2.5 py-2 space-y-1">
          <p className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide mb-1">
            Respondé esto para continuar
          </p>
          {questions.map((q, i) => (
            <p key={i} className="text-xs text-amber-300 leading-snug">
              <span className="font-bold mr-1">→</span>{q}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function getCommentStatus(comment: {
  status?: string;
  resolvedAt?: string | null;
  requiresResponse?: boolean;
}) {
  if (comment.resolvedAt || (comment.status ?? "").toLowerCase() === "resolved") {
    return { label: "resolved", variant: "green" as const };
  }

  if ((comment.status ?? "").toLowerCase() === "answered") {
    return { label: "answered", variant: "cyan" as const };
  }

  if (comment.requiresResponse) {
    return { label: "needs_response", variant: "amber" as const };
  }

  return { label: comment.status ?? "open", variant: "purple" as const };
}

export function TaskDetailPanel() {
  const demoMode = isPublicDemoMode();
  const selectedTaskId = useDashboardStore((s) => s.selectedTaskId);
  const showArchived = useDashboardStore((s) => s.showArchived);
  const setSelectedTaskId = useDashboardStore((s) => s.setSelectedTaskId);
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [updatingSubtaskId, setUpdatingSubtaskId] = useState<string | null>(null);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", showArchived],
    queryFn: () => getTasks({ includeArchived: showArchived }),
  });
  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const {
    data: subtasks,
    isLoading: subtasksLoading,
    isError: subtasksError,
  } = useQuery({
    queryKey: ["subtasks", selectedTaskId],
    queryFn: () => getTaskSubtasks(selectedTaskId!),
    enabled: !!selectedTaskId,
  });

  const {
    data: comments = [],
    isLoading: commentsLoading,
    isError: commentsError,
  } = useQuery({
    queryKey: ["comments", selectedTaskId],
    queryFn: () => getTaskComments(selectedTaskId!),
    enabled: !!selectedTaskId,
  });

  const sortedComments = [...comments].reverse();

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTaskId) {
        throw new Error("No selected task");
      }

      return addTaskComment(selectedTaskId, {
        body: newComment,
        authorType: "human",
        authorId: "operator",
      });
    },
    onSuccess: (createdComment) => {
      if (!selectedTaskId) return;

      queryClient.setQueryData<Comment[]>(["comments", selectedTaskId], (current) => {
        return [...(current ?? []), createdComment];
      });
      setNewComment("");
    },
  });

  const updateSubtaskStatusMutation = useMutation({
    mutationFn: async ({ subtaskId, nextStatus }: { subtaskId: string; nextStatus: "TODO" | "DOING" | "DONE" | "BLOCKED" }) => {
      return updateSubtaskStatus(subtaskId, nextStatus);
    },
    onMutate: async ({ subtaskId, nextStatus }) => {
      if (!selectedTaskId) return { previousSubtasks: undefined as Subtask[] | undefined };

      setUpdatingSubtaskId(subtaskId);
      await queryClient.cancelQueries({ queryKey: ["subtasks", selectedTaskId] });
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(["subtasks", selectedTaskId]);

      queryClient.setQueryData<Subtask[]>(["subtasks", selectedTaskId], (current = []) =>
        current.map((item) =>
          item.id === subtaskId
            ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
            : item,
        ),
      );

      return { previousSubtasks };
    },
    onError: (_error, _variables, context) => {
      if (!selectedTaskId) return;
      if (context?.previousSubtasks) {
        queryClient.setQueryData(["subtasks", selectedTaskId], context.previousSubtasks);
      }
    },
    onSettled: async () => {
      setUpdatingSubtaskId(null);
      await queryClient.invalidateQueries({ queryKey: ["activity"] });
      if (selectedTaskId) {
        await queryClient.invalidateQueries({ queryKey: ["subtasks", selectedTaskId] });
      }
    },
  });

  return (
    <Card title="Task Detail" className="h-full">
      {!selectedTaskId && <EmptyState message="Select a task to see details and subtasks" />}

      {selectedTask && (
        <div className="space-y-4">
          {/* Task header */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-100 leading-snug">{selectedTask.title}</h2>

            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={selectedTask.status} pulse={selectedTask.status === "IN_PROGRESS"} />
              {selectedTask.priority != null && (
                <StatusBadge
                  status={priorityLabel(selectedTask.priority)}
                  variant={priorityVariant(selectedTask.priority)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {selectedTask.assignedAgent && (
                <>
                  <span className="text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faUser} className="text-[10px]" />
                    Agent
                  </span>
                  <span className="text-slate-200">{selectedTask.assignedAgent.name}</span>
                </>
              )}
              {selectedTask.updatedAt && (
                <>
                  <span className="text-slate-500 flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                    Updated
                  </span>
                  <span className="text-slate-200">{fromNow(selectedTask.updatedAt)}</span>
                </>
              )}
              <span className="text-slate-500">ID</span>
              <span className="font-mono text-[10px] text-slate-400 truncate">{selectedTask.id}</span>
            </div>

            {selectedTask.description && (
              <p className="text-xs text-slate-400 rounded bg-surface-800 border border-surface-700 p-2">
                {selectedTask.description}
              </p>
            )}

            {!demoMode && selectedTask.status === "DONE" && !selectedTask.archivedAt && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={isArchiving}
                    onClick={async () => {
                      if (!confirmArchive) {
                        setConfirmArchive(true);
                        return;
                      }
                      setIsArchiving(true);
                      try {
                        await archiveTask(selectedTaskId!);
                        setSelectedTaskId(null);
                        await queryClient.invalidateQueries({ queryKey: ["tasks"] });
                      } finally {
                        setIsArchiving(false);
                        setConfirmArchive(false);
                      }
                    }}
                    className="rounded border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faBoxArchive} />
                    {isArchiving ? "Archiving..." : confirmArchive ? "Confirm Archive" : "Archive"}
                  </button>
                  {confirmArchive && !isArchiving && (
                    <button
                      onClick={() => setConfirmArchive(false)}
                      className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-slate-300 hover:bg-surface-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Subtasks {subtasks && `(${subtasks.length})`}
              </span>
            </div>

            {subtasksLoading && <SkeletonList rows={3} />}
            {subtasksError && <ErrorMessage message="Failed to load subtasks" />}
            {!subtasksLoading && !subtasksError && (!subtasks || subtasks.length === 0) && (
              <EmptyState message="No subtasks" />
            )}

            {subtasks && subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2 rounded border border-surface-700 bg-surface-800 px-3 py-2"
                  >
                    <span className="font-mono text-[10px] text-slate-600 w-4 shrink-0">
                      {sub.position ?? idx + 1}
                    </span>
                    <span className="text-xs text-slate-200 flex-1 min-w-0 truncate">{sub.title}</span>
                    {sub.ownerAgent && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                        {sub.ownerAgent.name}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={demoMode || updateSubtaskStatusMutation.isPending}
                      onClick={() => {
                        const nextStatus = getNextSubtaskStatus(sub.status);
                        updateSubtaskStatusMutation.mutate({ subtaskId: sub.id, nextStatus });
                      }}
                      className="disabled:cursor-not-allowed disabled:opacity-60"
                      title={demoMode ? "Read-only in demo mode" : "Click to cycle status"}
                    >
                      <StatusBadge status={sub.status} className={updatingSubtaskId === sub.id ? "opacity-70" : undefined} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-slate-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Comments {comments.length > 0 && `(${comments.length})`}
              </span>
            </div>

            {demoMode ? (
              <div className="mb-3 rounded border border-surface-700 bg-surface-800 px-3 py-2 text-[11px] text-slate-400">
                Comments are read-only in the static demo.
              </div>
            ) : (
              <form
                className="mb-3 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!newComment.trim()) return;
                  addCommentMutation.mutate();
                }}
              >
                <label className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Leave a note for {selectedTask.assignedAgent?.name ?? "the assigned agent"}
                </label>
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  rows={3}
                  placeholder="Write a comment for this card..."
                  className="w-full resize-y rounded-md border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  {addCommentMutation.isError ? (
                    <p className="text-[10px] text-rose-300">Failed to send comment. Try again.</p>
                  ) : (
                    <p className="text-[10px] text-slate-500">Comment will be attached to this task thread.</p>
                  )}
                  <button
                    type="submit"
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                    className="rounded border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addCommentMutation.isPending ? "Sending..." : "Post Comment"}
                  </button>
                </div>
              </form>
            )}

            {commentsLoading && <SkeletonList rows={3} />}
            {commentsError && <ErrorMessage message="Failed to load comments" />}
            {!commentsLoading && !commentsError && sortedComments.length === 0 && (
              <EmptyState message="No comments on this task" />
            )}

            {sortedComments.length > 0 && (
              <div className="space-y-1.5">
                {sortedComments.map((comment) => {
                  const derivedStatus = getCommentStatus(comment);

                  return (
                    <div
                      key={comment.id}
                      className="rounded border border-surface-700 bg-surface-800 px-3 py-2.5 space-y-1.5"
                    >
                      {comment.authorId === "main-openclaw-agent" && comment.body.startsWith("[Main] ") ? (
                        <MainAgentBubble body={comment.body} />
                      ) : (
                        <p className="text-xs text-slate-200 leading-snug whitespace-pre-wrap">{comment.body}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={AUTHOR_STYLE[comment.authorType] ?? AUTHOR_STYLE.system}>
                          {comment.authorType}
                        </span>
                        <StatusBadge status={derivedStatus.label} variant={derivedStatus.variant} />
                        {comment.requiresResponse && (
                          <span className="rounded px-1.5 py-0.5 bg-amber-900/40 text-amber-300">
                            requires response
                          </span>
                        )}
                        {comment.inReplyToId && (
                          <span className="text-slate-600">↩ reply</span>
                        )}
                        <span className="ml-auto text-slate-500 flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} />
                          {fromNow(comment.resolvedAt ?? comment.updatedAt ?? comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
