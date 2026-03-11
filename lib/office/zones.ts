export type ZoneId =
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
  | "hallway";

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
  "master-office": { id: "master-office", label: "Master Office", x: 13, y: 16 },
  "barko-office": { id: "barko-office", label: "Barko Office", x: 31, y: 16 },
  "dev-seat-1": { id: "dev-seat-1", label: "Dev Seat 1", x: 20, y: 46 },
  "dev-seat-2": { id: "dev-seat-2", label: "Dev Seat 2", x: 31, y: 46 },
  "dev-seat-3": { id: "dev-seat-3", label: "Dev Seat 3", x: 42, y: 46 },
  "dev-seat-4": { id: "dev-seat-4", label: "Dev Seat 4", x: 20, y: 61 },
  "dev-seat-5": { id: "dev-seat-5", label: "Dev Seat 5", x: 31, y: 61 },
  "dev-seat-6": { id: "dev-seat-6", label: "Dev Seat 6", x: 42, y: 61 },
  kitchen: { id: "kitchen", label: "Kitchen", x: 63, y: 27 },
  lounge: { id: "lounge", label: "Lounge", x: 73, y: 49 },
  "game-area": { id: "game-area", label: "Game Area", x: 84, y: 62 },
  terrace: { id: "terrace", label: "Terrace", x: 88, y: 18 },
  hallway: { id: "hallway", label: "Hallway", x: 53, y: 50 },
};
