import type { ZoneId } from "@/lib/office/zones";

/**
 * Walkable corridor graph for Lucy's movement.
 * Each key lists its directly connected neighbours (bidirectional).
 *
 * Layout (percentages match OFFICE_ZONES coordinates):
 *
 *  barko-office(88,30) ── nav-tr(72,32) ── nav-tl(22,32)
 *                              │                  │
 *                          nav-r1(72,45) ── nav-l1(22,45)
 *                              │                  │
 *                          nav-r2(72,61) ── nav-l2(22,61)
 *                              │                  │
 *                          nav-r3(72,79) ── nav-l3(22,79)
 *
 * Dev seats branch off the corridor nodes at the same row height.
 */
const PATH_GRAPH: Record<string, string[]> = {
  "barko-office": ["nav-tr"],
  // top corridor — go DOWN first (nav-r1), left branch (nav-tl) only when needed
  "nav-tr":  ["barko-office", "nav-r1", "nav-tl"],
  "nav-tl":  ["nav-tr", "nav-l1", "review-zone"],
  // right vertical — each node also bridges directly to the opposite-column seat at
  // the same row so Lucy never overshoots leftward past the seat
  "nav-r1":  ["nav-tr", "nav-r2", "nav-l1", "dev-seat-2", "dev-seat-1"],
  "nav-r2":  ["nav-r1", "nav-r3", "nav-l2", "dev-seat-4", "dev-seat-3"],
  "nav-r3":  ["nav-r2", "nav-l3", "dev-seat-6", "dev-seat-5", "idle-zone", "game-area"],
  // left vertical
  "nav-l1":  ["nav-r1", "nav-tl", "nav-l2", "dev-seat-1", "thinking-zone"],
  "nav-l2":  ["nav-r2", "nav-l1", "nav-l3", "dev-seat-3"],
  "nav-l3":  ["nav-r3", "nav-l2", "dev-seat-5", "blocked-zone-a", "blocked-zone-b"],
  // dev seats (leaf nodes — right column)
  "dev-seat-2": ["nav-r1"],
  "dev-seat-4": ["nav-r2"],
  "dev-seat-6": ["nav-r3"],
  // dev seats (leaf nodes — left column, reachable from right corridor without detour)
  "dev-seat-1": ["nav-r1", "nav-l1"],
  "dev-seat-3": ["nav-r2", "nav-l2"],
  "dev-seat-5": ["nav-r3", "nav-l3"],
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
 * Each hop (waypoint + final destination) takes ~1 800 ms with the spring.
 */
export function estimateWalkMs(waypoints: ZoneId[]): number {
  const hops = waypoints.length + 1; // +1 for the final leg into targetZone
  return Math.max(hops * 1800, 3000);
}
