const MCLUCY_LINES = [
  "How's the sprint looking?",
  "Any blockers I should know?",
  "Quick sync — all good?",
  "Good work on that last one.",
  "Status update?",
  "Need anything from me?",
  "Keep it up.",
  "On schedule?",
];

const AGENT_RESPONSES = [
  "All on track.",
  "One dep pending, manageable.",
  "Almost done with this.",
  "On it, chief.",
  "Just wrapped a review.",
  "Finishing up now.",
  "Looks good from here.",
  "Will have it ready soon.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildVisitDialogue(
  mcLucyId: string,
  targetAgentId: string,
): Record<string, string> {
  return {
    [mcLucyId]: pick(MCLUCY_LINES),
    [targetAgentId]: pick(AGENT_RESPONSES),
  };
}
