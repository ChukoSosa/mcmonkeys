import { BlockHero } from "./block-hero";
import { BlockScreenshots } from "./block-screenshots";
import { BlockOrigin } from "./block-origin";
import { BlockThreeRoles } from "./block-three-roles";
import { BlockCoreIdea } from "./block-core-idea";
import { BlockMeetMissionControl } from "./block-meet-mission-control";
import { BlockFourQuestions } from "./block-four-questions";
import { BlockThreeDollarStory } from "./block-three-dollar-story";
import { BlockFinalCta } from "./block-final-cta";

export const metadata = {
  title: "MC-MONKEYS | Landing",
  description: "MC-MONKEYS for AI Agents.",
};

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-[#050912] via-[#050a15] to-[#03050b]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.12),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_55%_90%,rgba(15,23,42,0.85),transparent_60%)]" />
      <div className="relative">
        <BlockHero />
        <BlockScreenshots />
        <BlockOrigin />
        <BlockThreeRoles />
        <BlockCoreIdea />
        <BlockMeetMissionControl />
        <BlockFourQuestions />
        <BlockThreeDollarStory />
        <BlockFinalCta />
      </div>
    </main>
  );
}
