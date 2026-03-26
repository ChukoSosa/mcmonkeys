"use client";

import { useEffect, useRef } from "react";
import type { ZoneId } from "@/lib/office/zones";
import { buildVisitDialogue } from "@/lib/office/officeEvents";

const MCLUCY_ID = "mclucy-chief";
const WALK_DURATION_MS = 4_000;
const CHAT_DURATION_MS = 7_000;
const RETURN_WALK_MS = 4_500;

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
 * Schedules random office events: mcLucy walks to a random agent,
 * they exchange speech bubbles, then she returns to her office.
 *
 * getAvailableAgents is called at event-fire time (via ref) so it always
 * reflects the current scene state without creating new effect deps.
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

      // Phase 1: mcLucy walks to target agent's zone
      onZoneOverride({ [MCLUCY_ID]: target.zone });

      // Phase 2: show speech bubbles after she arrives
      after(() => {
        onSpeechBubbles(buildVisitDialogue(MCLUCY_ID, target.id));
      }, WALK_DURATION_MS);

      // Phase 3: end conversation, mcLucy walks back
      after(() => {
        onClearBubbles();
        onClearOverrides();
      }, WALK_DURATION_MS + CHAT_DURATION_MS);

      // Schedule next event after full cycle completes
      after(scheduleNext, WALK_DURATION_MS + CHAT_DURATION_MS + RETURN_WALK_MS);
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
