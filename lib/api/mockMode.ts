export function shouldUseMockData(): boolean {
  const override = process.env.NEXT_PUBLIC_USE_MOCK_DATA;

  if (override === "true") return true;
  if (override === "false") return false;

  // Default behavior: use real API unless mocks are explicitly requested.
  return false;
}
