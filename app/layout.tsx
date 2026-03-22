import type { Metadata } from "next";
import { Suspense } from "react";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Operational dashboard for Mission Control agents and tasks",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <ErrorBoundary fallbackMessage="The application hit an unexpected error. Refresh the page and try again.">
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
