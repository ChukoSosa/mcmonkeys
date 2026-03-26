export type ZoneId =
  | "chief-desk"
  | "master-office"
  | "barko-office"
  | "dev-seat-1"
  | "dev-seat-2"
  | "dev-seat-3"
  | "dev-seat-4"
  | "dev-seat-5"
  | "dev-seat-6"
  | "kitchen"
  | "lounge"
  | "game-area"
  | "terrace"
  | "hallway"
  | "idle-zone"
  | "thinking-zone"
  | "review-zone"
  | "blocked-zone-a"
  | "blocked-zone-b"
  // Lucy's walking path corridor nodes
  | "nav-tr"
  | "nav-tl"
  | "nav-r1"
  | "nav-l1"
  | "nav-r2"
  | "nav-l2"
  | "nav-r3"
  | "nav-l3";

export interface ZoneConfig {
  id: ZoneId;
  label: string;
  x: number;
  y: number;
}

export const DEV_SEAT_IDS: ZoneId[] = [
  "dev-seat-1",
  "dev-seat-2",
  "dev-seat-3",
  "dev-seat-4",
  "dev-seat-5",
  "dev-seat-6",
];

export const OFFICE_ZONES: Record<ZoneId, ZoneConfig> = {
  "chief-desk": { id: "chief-desk", label: "Operations Desk", x: 50, y: 17 },
  "master-office": { id: "master-office", label: "Master Office", x: 50, y: 15 },
  "barko-office": { id: "barko-office", label: "Barko Office", x: 88, y: 30 },
  "dev-seat-1": { id: "dev-seat-1", label: "Dev Seat 1", x: 43, y: 45 },
  "dev-seat-2": { id: "dev-seat-2", label: "Dev Seat 2", x: 57, y: 45 },
  "dev-seat-3": { id: "dev-seat-3", label: "Dev Seat 3", x: 43, y: 61 },
  "dev-seat-4": { id: "dev-seat-4", label: "Dev Seat 4", x: 57, y: 61 },
  "dev-seat-5": { id: "dev-seat-5", label: "Dev Seat 5", x: 43, y: 79 },
  "dev-seat-6": { id: "dev-seat-6", label: "Dev Seat 6", x: 57, y: 79 },
  kitchen: { id: "kitchen", label: "Kitchen", x: 15, y: 12 },
  lounge: { id: "lounge", label: "Lounge", x: 88, y: 32 },
  "game-area": { id: "game-area", label: "Game Area", x: 80, y: 85 },
  terrace: { id: "terrace", label: "Terrace", x: 15, y: 80 },
  hallway: { id: "hallway", label: "Hallway", x: 50, y: 34 },
  "idle-zone": { id: "idle-zone", label: "Idle Zone", x: 88, y: 74 },
  "thinking-zone": { id: "thinking-zone", label: "Thinking Zone", x: 15, y: 52 },
  "review-zone": { id: "review-zone", label: "Review Zone", x: 18, y: 19 },
  "blocked-zone-a": { id: "blocked-zone-a", label: "Blocked (A)", x: 12, y: 82 },
  "blocked-zone-b": { id: "blocked-zone-b", label: "Blocked (B)", x: 16, y: 86 },
  // Lucy's walking path corridor nodes (invisible waypoints)
  "nav-tr": { id: "nav-tr", label: "Corridor", x: 72, y: 32 },
  "nav-tl": { id: "nav-tl", label: "Corridor", x: 22, y: 32 },
  "nav-r1": { id: "nav-r1", label: "Corridor", x: 72, y: 45 },
  "nav-l1": { id: "nav-l1", label: "Corridor", x: 22, y: 45 },
  "nav-r2": { id: "nav-r2", label: "Corridor", x: 72, y: 61 },
  "nav-l2": { id: "nav-l2", label: "Corridor", x: 22, y: 61 },
  "nav-r3": { id: "nav-r3", label: "Corridor", x: 72, y: 79 },
  "nav-l3": { id: "nav-l3", label: "Corridor", x: 22, y: 79 },
};
