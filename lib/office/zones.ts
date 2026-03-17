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
  "chief-desk": { id: "chief-desk", label: "Operations Desk", x: 50, y: 17 },
  "master-office": { id: "master-office", label: "Master Office", x: 50, y: 15 },
  "barko-office": { id: "barko-office", label: "Barko Office", x: 88, y: 30 },
  "dev-seat-1": { id: "dev-seat-1", label: "Dev Seat 1", x: 43, y: 45 },
  "dev-seat-2": { id: "dev-seat-2", label: "Dev Seat 2", x: 57, y: 45 },
  "dev-seat-3": { id: "dev-seat-3", label: "Dev Seat 3", x: 43, y: 58 },
  "dev-seat-4": { id: "dev-seat-4", label: "Dev Seat 4", x: 57, y: 58 },
  "dev-seat-5": { id: "dev-seat-5", label: "Dev Seat 5", x: 35, y: 52 },
  "dev-seat-6": { id: "dev-seat-6", label: "Dev Seat 6", x: 65, y: 52 },
  kitchen: { id: "kitchen", label: "Kitchen", x: 15, y: 12 },
  lounge: { id: "lounge", label: "Lounge", x: 88, y: 32 },
  "game-area": { id: "game-area", label: "Game Area", x: 80, y: 85 },
  terrace: { id: "terrace", label: "Terrace", x: 15, y: 80 },
  hallway: { id: "hallway", label: "Hallway", x: 50, y: 34 },
};
