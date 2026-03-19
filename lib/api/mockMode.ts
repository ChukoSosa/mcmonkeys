import { getRuntimePolicy } from "@/lib/runtime/profile";

export function shouldUseMockData(): boolean {
  return getRuntimePolicy().useStaticMockData;
}

export function usesMockDataSource(): boolean {
  return getRuntimePolicy().usesMockDataSource;
}
