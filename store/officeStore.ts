import { create } from "zustand";
import type { ZoneId } from "@/lib/office/zones";
import { computeWaypoints } from "@/lib/office/lucyPath";

export interface AgentPositionState {
  currentZone: ZoneId;
  targetZone: ZoneId;
  waypointQueue: ZoneId[];
  isMoving: boolean;
}

interface OfficeStoreState {
  selectedAgentId: string | null;
  agentPositions: Record<string, AgentPositionState>;
  avatarMapping: Record<string, string>;
  setSelectedAgentId: (agentId: string | null) => void;
  setAvatar: (agentId: string, avatarUrl: string) => void;
  hydrateAvatarMapping: (mapping: Record<string, string>) => void;
  syncAgentTargets: (targets: Record<string, ZoneId>) => void;
  advanceAgentTransition: (agentId: string) => void;
}

export const useOfficeStore = create<OfficeStoreState>((set) => ({
  selectedAgentId: null,
  agentPositions: {},
  avatarMapping: {},

  setSelectedAgentId: (agentId) => set({ selectedAgentId: agentId }),

  setAvatar: (agentId, avatarUrl) =>
    set((state) => ({
      avatarMapping: {
        ...state.avatarMapping,
        [agentId]: avatarUrl,
      },
    })),

  hydrateAvatarMapping: (mapping) => set({ avatarMapping: mapping }),

  syncAgentTargets: (targets) =>
    set((state) => {
      const next: Record<string, AgentPositionState> = { ...state.agentPositions };
      let changed = false;

      Object.entries(targets).forEach(([agentId, targetZone]) => {
        const existing = next[agentId];

        if (!existing) {
          next[agentId] = {
            currentZone: targetZone,
            targetZone,
            waypointQueue: [],
            isMoving: false,
          };
          changed = true;
          return;
        }

        if (existing.isMoving) {
          if (existing.targetZone !== targetZone) {
            next[agentId] = { ...existing, targetZone };
            changed = true;
          }
          return;
        }

        if (existing.currentZone !== targetZone) {
          const waypointQueue = computeWaypoints(existing.currentZone, targetZone);
          next[agentId] = {
            currentZone: existing.currentZone,
            targetZone,
            waypointQueue,
            isMoving: true,
          };
          changed = true;
        }
      });

      Object.keys(next).forEach((agentId) => {
        if (!targets[agentId]) {
          delete next[agentId];
          changed = true;
        }
      });

      if (!changed) return state;
      return { agentPositions: next };
    }),

  advanceAgentTransition: (agentId) =>
    set((state) => {
      const existing = state.agentPositions[agentId];
      if (!existing || !existing.isMoving) return state;

      const next = { ...state.agentPositions };

      if (existing.waypointQueue.length > 0) {
        const [reached, ...remaining] = existing.waypointQueue;
        next[agentId] = {
          ...existing,
          currentZone: reached,
          waypointQueue: remaining,
        };
      } else {
        next[agentId] = {
          currentZone: existing.targetZone,
          targetZone: existing.targetZone,
          waypointQueue: [],
          isMoving: false,
        };
      }

      return { agentPositions: next };
    }),
}));
