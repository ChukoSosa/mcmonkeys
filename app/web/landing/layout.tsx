import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MC-MONKEYS | Landing",
  description: "Mission Control for AI agents. Built by a human, designed with an agent, and operated by intelligence.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
