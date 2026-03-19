import { getRuntimePolicy } from "@/lib/runtime/profile";

export function isPublicDemoMode(): boolean {
  return getRuntimePolicy().isOnlineDemo;
}

export function getRealtimeRefetchInterval(intervalMs: number): number | false {
  return isPublicDemoMode() ? false : intervalMs;
}