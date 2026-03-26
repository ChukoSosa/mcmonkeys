import type { ZoneId } from "@/lib/office/zones";

/**
 * Walkable corridor graph for Lucy's movement.
 * Each key lists its directly connected neighbours (bidirectional).
 *
 * Layout (percentages match OFFICE_ZONES coordinates):
 *
 *  barko-office(88,30) ── nav-tr(72,32) ── nav-tl(32,32)
 *                              │                  │
 *                          nav-r1(72,45)      nav-l1(32,45)
 *                              │                  │
 *                          nav-r2(72,61)      nav-l2(32,61)
 *                              │                  │
 *                          nav-r3(72,79)      nav-l3(32,79)
 *
 * Right aisle (x=72): right of the right-column seats (x=57) → dev-seat-2,4,6.
 * Left aisle  (x=32): left  of the left-column  seats (x=43) → dev-seat-1,3,5.
 * No horizontal connections at seat heights — those would cross through desks.
 */
const PATH_GRAPH: Record<string, string[]> = {
  "barko-office": ["nav-tr"],
  // top corridor connects both aisles
  "nav-tr": ["barko-office", "nav-r1", "nav-tl", "master-office", "chief-desk"],
  "nav-tl": ["nav-tr", "nav-l1", "review-zone"],
  // right aisle — only right-column seats (dev-seat-2,4,6)
  "nav-r1": ["nav-tr", "nav-r2", "dev-seat-2"],
  "nav-r2": ["nav-r1", "nav-r3", "dev-seat-4"],
  "nav-r3": ["nav-r2", "dev-seat-6", "idle-zone", "game-area"],
  // left aisle — only left-column seats (dev-seat-1,3,5)
  "nav-l1": ["nav-tl", "nav-l2", "dev-seat-1", "thinking-zone"],
  "nav-l2": ["nav-l1", "nav-l3", "dev-seat-3"],
  "nav-l3": ["nav-l2", "dev-seat-5", "nav-l-blocked"],
  "nav-l-blocked": ["nav-l3", "blocked-zone-a", "blocked-zone-b"],
  // right-column seats (leaf nodes)
  "dev-seat-2": ["nav-r1"],
  "dev-seat-4": ["nav-r2"],
  "dev-seat-6": ["nav-r3"],
  // left-column seats (leaf nodes)
  "dev-seat-1": ["nav-l1"],
  "dev-seat-3": ["nav-l2"],
  "dev-seat-5": ["nav-l3"],
  // top office zones
  "master-office": ["nav-tr"],
  "chief-desk":    ["nav-tr"],
  // special state zones
  "review-zone":    ["nav-tl"],
  "thinking-zone":  ["nav-l1"],
  "idle-zone":      ["nav-r3"],
  "game-area":      ["nav-r3"],
  "blocked-zone-a": ["nav-l3"],
  "blocked-zone-b": ["nav-l3"],
};

/** BFS — returns full path [from, ...intermediates, to] or null if unreachable. */
function bfs(from: string, to: string): string[] | null {
  if (from === to) return [from];

  const queue: string[][] = [[from]];
  const visited = new Set<string>([from]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const node = path[path.length - 1];

    for (const neighbour of PATH_GRAPH[node] ?? []) {
      if (visited.has(neighbour)) continue;
      const next = [...path, neighbour];
      if (neighbour === to) return next;
      visited.add(neighbour);
      queue.push(next);
    }
  }

  return null;
}

/**
 * Returns the intermediate waypoints Lucy should visit when moving from
 * `fromZone` to `toZone`.  The result excludes both endpoints — the store
 * already tracks currentZone and targetZone separately.
 *
 * Returns [] when either zone is outside the path graph (direct move).
 */
export function computeWaypoints(fromZone: ZoneId, toZone: ZoneId): ZoneId[] {
  if (fromZone === toZone) return [];

  const path = bfs(fromZone, toZone);
  if (!path) return [];

  // Strip the start (already there) and end (stored as targetZone)
  return path.slice(1, -1) as ZoneId[];
}

/**
 * Estimates the walk time in ms for a given set of intermediate waypoints.
 * Each hop (waypoint + final destination) takes ~1 400 ms with the spring.
 */
export function estimateWalkMs(waypoints: ZoneId[]): number {
  const hops = waypoints.length + 1; // +1 for the final leg into targetZone
  return Math.max(hops * 1400, 2800);
}

/**
 * Some zones (e.g. blocked-zone-a/b) are at extreme positions where Lucy
 * arriving exactly on top of the agent causes an ugly offset jump.
 * This map redirects Lucy to stop one step earlier, at the corridor node
 * closest to the zone instead of the zone itself.
 */
export const LUCY_APPROACH_ZONE: Partial<Record<ZoneId, ZoneId>> = {
  "blocked-zone-a": "nav-l-blocked",
  "blocked-zone-b": "nav-l-blocked",
};
