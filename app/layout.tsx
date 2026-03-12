import type { Metadata } from "next";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { bootstrapMissionControl } from "@/lib/mission/bootstrap";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Operational dashboard for Mission Control agents and tasks",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Bootstrap flow prepares Mission Control for first use through an onboarding checklist task.
  await bootstrapMissionControl();

  return (
    <html lang="en" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
