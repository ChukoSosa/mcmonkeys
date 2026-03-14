import { BlockHero } from "./block-hero";
import { BlockOrigin } from "./block-origin";

export const metadata = {
  title: "MC Lucy | Landing",
  description: "Mission Control for AI Agents.",
};

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-[#050912] via-[#050a15] to-[#03050b]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.12),transparent_40%),radial-gradient(circle_at_85%_25%,rgba(56,189,248,0.14),transparent_35%),radial-gradient(circle_at_55%_90%,rgba(15,23,42,0.85),transparent_60%)]" />
      <div className="relative">
        <BlockHero />
        <BlockOrigin />
      </div>
    </main>
  );
}
