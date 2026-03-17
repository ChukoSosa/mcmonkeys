export function shouldUseMockData(): boolean {
  const override = process.env.NEXT_PUBLIC_USE_MOCK_DATA;
  const isPublicDemo = process.env.NEXT_PUBLIC_MISSION_CONTROL_DEMO_MODE === "true";

  if (override === "true") return true;
  if (override === "false") return isPublicDemo;

  // Default behavior: demo mode uses mock data; otherwise use real API.
  return isPublicDemo;
}
