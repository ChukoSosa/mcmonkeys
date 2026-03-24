import { getRuntimePolicy } from "@/lib/runtime/profile";

export function shouldUseMockData(): boolean {
  // Always go through the API:
  // - local-dev: API route uses localDevMockStore (JSON file)
  // - online-demo: API route uses taskService (Prisma demo DB)
  // - install-local: API route uses taskService (real DB)
  return false;
}

export function usesMockDataSource(): boolean {
  return getRuntimePolicy().usesMockDataSource;
}
