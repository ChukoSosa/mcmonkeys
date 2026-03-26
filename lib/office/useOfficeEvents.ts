"use client";

import { useEffect, useRef } from "react";
import type { ZoneId } from "@/lib/office/zones";
import { buildVisitDialogue } from "@/lib/office/officeEvents";
import { computeWaypoints, estimateWalkMs } from "@/lib/office/lucyPath";

const MCLUCY_ID = "mclucy-chief";
const MCLUCY_BASE_ZONE: ZoneId = "barko-office";
const CHAT_DURATION_MS = 7_000;

interface AvailableAgent {
  id: string;
  zone: ZoneId;
}

interface OfficeEventsCallbacks {
  onZoneOverride: (overrides: Record<string, ZoneId>) => void;
  onSpeechBubbles: (bubbles: Record<string, string>) => void;
  onClearBubbles: () => void;
  onClearOverrides: () => void;
}

interface UseOfficeEventsOptions {
  minIntervalMs?: number;
  maxIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Schedules random office events: mcLucy walks to a random agent along the
 * corridor path, they exchange speech bubbles, then she walks back.
 *
 * Walk times are derived from the actual path length so the bubbles appear
 * only after Lucy has physically arrived at the destination.
 */
export function useOfficeEvents(
  getAvailableAgents: () => AvailableAgent[],
  callbacks: OfficeEventsCallbacks,
  { minIntervalMs = 120_000, maxIntervalMs = 240_000, enabled = true }: UseOfficeEventsOptions = {},
) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const getAgentsRef = useRef(getAvailableAgents);
  getAgentsRef.current = getAvailableAgents;

  useEffect(() => {
    if (!enabled) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;

    const after = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(t);
    };

    const runEvent = () => {
      const agents = getAgentsRef.current().filter((a) => a.id !== MCLUCY_ID);
      if (agents.length === 0) {
        scheduleNext();
        return;
      }

      const target = agents[Math.floor(Math.random() * agents.length)];
      const { onZoneOverride, onSpeechBubbles, onClearBubbles, onClearOverrides } =
        callbacksRef.current;

      // Compute walk time based on actual path length
      const waypoints = computeWaypoints(MCLUCY_BASE_ZONE, target.zone);
      const walkMs = estimateWalkMs(waypoints);
      const returnMs = estimateWalkMs(waypoints) + 1_000; // return same path + buffer

      // Phase 1: Lucy walks to the target agent's zone
      onZoneOverride({ [MCLUCY_ID]: target.zone });

      // Phase 2: show speech bubbles once she has arrived
      after(() => {
        onSpeechBubbles(buildVisitDialogue(MCLUCY_ID, target.id));
      }, walkMs);

      // Phase 3: end conversation, Lucy walks back
      after(() => {
        onClearBubbles();
        onClearOverrides();
      }, walkMs + CHAT_DURATION_MS);

      // Schedule next event after full cycle completes
      after(scheduleNext, walkMs + CHAT_DURATION_MS + returnMs);
    };

    const scheduleNext = () => {
      const delay = minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
      after(runEvent, delay);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      callbacksRef.current.onClearBubbles();
      callbacksRef.current.onClearOverrides();
    };
  }, [enabled, minIntervalMs, maxIntervalMs]);
}
