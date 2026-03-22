"use client";

import { useEffect, useMemo } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent, isAnalyticsEnabled } from "@/lib/analytics/ga";

function getReferrerPath(): string {
  if (typeof document === "undefined") return "";

  try {
    const referrer = document.referrer;
    if (!referrer) return "";
    const parsed = new URL(referrer);
    return parsed.pathname || "";
  } catch {
    return "";
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  const analyticsEnabled = useMemo(() => isAnalyticsEnabled() && Boolean(gaId), [gaId]);

  useEffect(() => {
    if (!analyticsEnabled || !pathname) return;

    const query = searchParams?.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    trackEvent("page_view", {
      page_path: pagePath,
      page_title: typeof document !== "undefined" ? document.title : "",
    });

    if (pathname === "/web/payment") {
      trackEvent("checkout_page_view", {
        page_path: pagePath,
      });
    }

    if (pathname === "/web/thank-you") {
      trackEvent("thank_you_view", {
        page_path: pagePath,
      });
    }

    if (pathname.startsWith("/app") && process.env.NEXT_PUBLIC_RUNTIME_PROFILE === "online-demo") {
      trackEvent("demo_online_view", {
        source_page: getReferrerPath(),
        page_path: pagePath,
      });
    }
  }, [analyticsEnabled, pathname, searchParams]);

  if (!analyticsEnabled || !gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = gtag; gtag('js', new Date()); gtag('config', '${gaId}', { send_page_view: false });`}
      </Script>
    </>
  );
}
