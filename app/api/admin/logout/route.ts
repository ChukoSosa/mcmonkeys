import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/security/admin-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearSessionCookie());
  return response;
}
