import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MC-MONKEYS | Story",
  description: "The story behind MC-MONKEYS — why it exists, who built it, and what it's trying to solve.",
};

export default function StoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
