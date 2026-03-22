import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionToken, sessionCookieOptions } from "@/lib/security/admin-session";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function isBackofficeEnabled() {
  return process.env.BACKOFFICE_ENABLED === "true";
}

export async function POST(request: NextRequest) {
  if (!isBackofficeEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const adminEmail = process.env.BUGS_ADMIN_EMAIL;
  const adminHash = process.env.BUGS_ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  const emailMatch = parsed.data.email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatch = await bcrypt.compare(parsed.data.password, adminHash);

  if (!emailMatch || !passwordMatch) {
    // Constant-time delay to prevent timing attacks
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken(parsed.data.email);
  const opts = sessionCookieOptions(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(opts);
  return response;
}
