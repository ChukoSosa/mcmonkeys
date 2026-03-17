import { headers } from "next/headers";
import { redirect } from "next/navigation";

const RAILWAY_PUBLIC_HOST = "mcmonkeys.up.railway.app";

function getRedirectTarget(hostname: string): string {
  const normalized = hostname.toLowerCase();

  if (normalized.includes("localhost") || normalized.includes("127.0.0.1")) {
    return "/overview";
  }

  if (normalized.includes(RAILWAY_PUBLIC_HOST)) {
    return "/web/landing";
  }

  return "/overview";
}

export default async function Home() {
  const requestHeaders = await headers();
  const hostHeader = requestHeaders.get("host") ?? "";
  redirect(getRedirectTarget(hostHeader));
}
