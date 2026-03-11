"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faRobot,
  faListCheck,
  faBolt,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import type { Agent } from "@/types";
import { getTasks } from "@/lib/api/tasks";
import { getActivity } from "@/lib/api/activity";
import { Card, StatusBadge, EmptyState, ErrorMessage, SkeletonList } from "@/components/ui";
import { fromNow } from "@/lib/utils/formatDate";

interface AgentDetailModalProps {
  agent: Agent | null;
  open: boolean;
  onClose: () => void;
}

export function AgentDetailModal({ agent, open, onClose }: AgentDetailModalProps) {
  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
    enabled: open,
  });

  const {
    data: activity = [],
    isLoading: activityLoading,
    isError: activityError,
  } = useQuery({
    queryKey: ["activity", { agentId: agent?.id, limit: 20 }],
    queryFn: () => getActivity({ agentId: agent?.id, limit: 20 }),
    enabled: open && !!agent?.id,
  });

  const assignedTasks = useMemo(() => {
    if (!agent) return [];
    return tasks.filter((task) => {
      const matchByObject = task.assignedAgent?.id === agent.id;
      const matchByDirectId = task.assignedAgentId === agent.id;
      const matchByOwner = task.ownerAgentId === agent.id;
      const matchByName = task.assignedAgent?.name?.toLowerCase() === agent.name.toLowerCase();
      return matchByObject || matchByDirectId || matchByOwner || matchByName;
    });
  }, [agent, tasks]);

  const lastActivity = activity[0];

  if (!open || !agent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-surface-700 bg-surface-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FontAwesomeIcon icon={faRobot} className="text-purple-400" />
            <h2 className="truncate text-sm font-semibold text-slate-100">{agent.name}</h2>
            <StatusBadge status={agent.status} pulse={agent.status?.toUpperCase() === "RUNNING"} />
          </div>
          <button
            onClick={onClose}
            className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-slate-300 hover:bg-surface-700"
            aria-label="Close agent details"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="grid gap-4 p-4 lg:grid-cols-2 overflow-y-auto max-h-[calc(90vh-60px)]">
          <Card title="Agent Overview" className="h-full">
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500">Name</span>
                <span className="text-slate-200">{agent.name}</span>
                <span className="text-slate-500">Role</span>
                <span className="text-slate-200">{agent.role ?? "—"}</span>
                <span className="text-slate-500">Status message</span>
                <span className="text-slate-200">{agent.statusMessage ?? "—"}</span>
                <span className="text-slate-500">Last heartbeat</span>
                <span className="text-slate-200">{fromNow(agent.heartbeat)}</span>
              </div>

              <div className="rounded border border-surface-700 bg-surface-800 p-2">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Last activity</p>
                {!activityLoading && !lastActivity && (
                  <p className="text-slate-400">No activity detected for this agent.</p>
                )}
                {activityLoading && <p className="text-slate-500">Loading activity…</p>}
                {lastActivity && (
                  <div className="space-y-1">
                    <p className="text-slate-200">
                      {lastActivity.summary ?? lastActivity.type ?? lastActivity.event ?? lastActivity.action ?? lastActivity.kind ?? "Activity event"}
                    </p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} />
                      {fromNow(lastActivity.occurredAt ?? lastActivity.createdAt ?? lastActivity.timestamp ?? lastActivity.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card title="Assigned Tasks" className="h-full">
            {tasksLoading && <SkeletonList rows={4} />}
            {tasksError && <ErrorMessage message="Failed to load tasks" />}
            {!tasksLoading && !tasksError && assignedTasks.length === 0 && (
              <EmptyState message="No tasks assigned" />
            )}
            {assignedTasks.length > 0 && (
              <div className="space-y-2">
                {assignedTasks.map((task) => (
                  <div key={task.id} className="rounded border border-surface-700 bg-surface-800 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faListCheck} className="text-cyan-400 text-[10px]" />
                        <span className="truncate text-xs text-slate-100">{task.title}</span>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">updated {fromNow(task.updatedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Recent Agent Activity" className="h-full lg:col-span-2">
            {activityLoading && <SkeletonList rows={4} />}
            {activityError && <ErrorMessage message="Failed to load activity" />}
            {!activityLoading && !activityError && activity.length === 0 && (
              <EmptyState message="No recent activity" />
            )}
            {activity.length > 0 && (
              <div className="space-y-1.5">
                {activity.map((item, idx) => (
                  <div key={item.id ?? idx} className="rounded border border-surface-700 bg-surface-800 p-2">
                    <p className="text-xs text-slate-200 flex items-start gap-1.5">
                      <FontAwesomeIcon icon={faBolt} className="text-amber-400 mt-0.5 text-[10px]" />
                      <span>{item.summary ?? item.type ?? item.event ?? item.action ?? item.kind ?? "Activity event"}</span>
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {fromNow(item.createdAt ?? item.timestamp ?? item.updatedAt ?? item.occurredAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
