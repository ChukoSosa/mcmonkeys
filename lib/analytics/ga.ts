export type AnalyticsDestinationType =
  | "internal_payment"
  | "external_checkout"
  | "onpage_checkout_form"
  | "license_modal";

export interface BuyCtaClickParams {
  cta_location: string;
  destination_type: AnalyticsDestinationType;
  destination: string;
}

export interface CheckoutRedirectClickParams {
  plan: "annual" | "monthly";
  provider: "lemonsqueezy";
  checkout_url: string;
}

export function isAnalyticsEnabled(): boolean {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return false;

  const profile = process.env.NEXT_PUBLIC_RUNTIME_PROFILE;
  if (profile === "online-demo") return true;

  return process.env.NODE_ENV === "production";
}

function getGtag(): ((command: string, eventName: string, params?: Record<string, unknown>) => void) | null {
  if (typeof window === "undefined") return null;
  const maybeGtag = (window as Window & { gtag?: typeof window.gtag }).gtag;
  return typeof maybeGtag === "function" ? maybeGtag : null;
}

export function trackEvent(eventName: string, params: Record<string, unknown> = {}): void {
  if (!isAnalyticsEnabled()) return;

  const gtag = getGtag();
  if (!gtag) return;

  gtag("event", eventName, params);
}

export function trackBuyCtaClick(params: BuyCtaClickParams): void {
  trackEvent("buy_cta_click", { ...params });
}

export function trackCheckoutRedirectClick(params: CheckoutRedirectClickParams): void {
  trackEvent("checkout_redirect_click", { ...params });
}
