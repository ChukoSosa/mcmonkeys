import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";
import { authenticateRequest, hasRequiredRole, type AuthRole } from "@/lib/security/auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRuntimePolicy } from "@/lib/runtime/profile";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isReadOnlyDemoMode(): boolean {
  return getRuntimePolicy().isReadOnly;
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

function requiredRoleFor(request: NextRequest): AuthRole {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (method === "DELETE") {
    return "admin";
  }

  if (pathname.startsWith("/api/agents") || pathname.startsWith("/api/tasks")) {
    return "operator";
  }

  return "viewer";
}

async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.BUGS_SESSION_SECRET;
  if (!secret) return false;
  const token = request.cookies.get("admin_session")?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const method = request.method.toUpperCase();
  const pathname = request.nextUrl.pathname;
  const isMutatingMethod = MUTATING_METHODS.has(method);
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const baseRequestHeaders = new Headers(request.headers);
  baseRequestHeaders.set("x-request-id", requestId);

  // ── Backoffice guard (/login page, /admin/* pages, /api/admin/* endpoints) ──
  const isAdminPage = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  if (isAdminPage || isLoginPage || isAdminApiRoute) {
    const enabled = process.env.BACKOFFICE_ENABLED === "true";
    if (!enabled) {
      if (isAdminApiRoute) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Not found" }, { status: 404 }),
        );
      }
      return new NextResponse(null, { status: 404 });
    }

    if (isLoginPage) {
      const authed = await verifyAdminSession(request);
      if (authed) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return withSecurityHeaders(
        NextResponse.next({ request: { headers: baseRequestHeaders } }),
      );
    }

    if (isAdminPage) {
      const authed = await verifyAdminSession(request);
      if (!authed) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return withSecurityHeaders(
        NextResponse.next({ request: { headers: baseRequestHeaders } }),
      );
    }

    // isAdminApiRoute — route handlers do their own session check; just add headers
    return withSecurityHeaders(
      NextResponse.next({ request: { headers: baseRequestHeaders } }),
    );
  }


  // Public endpoints — no auth or demo-mode guard required
  if (pathname === "/api/health" || pathname === "/api/license/validate") {
    return withSecurityHeaders(
      NextResponse.next({
        request: {
          headers: baseRequestHeaders,
        },
      }),
    );
  }

  if (isMutatingMethod) {
    if (isReadOnlyDemoMode()) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            error: "Read-only demo",
            code: "DEMO_MODE_READ_ONLY",
          },
          { status: 403 },
        ),
      );
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimit = checkRateLimit(`api:${clientIp}:${pathname}`, {
      windowMs: 60_000,
      maxRequests: Number.parseInt(process.env.MISSION_CONTROL_RATE_LIMIT_PER_MINUTE ?? "120", 10),
    });

    if (!rateLimit.allowed) {
      const tooMany = NextResponse.json(
        {
          error: "Too many requests",
          code: "TOO_MANY_REQUESTS",
        },
        { status: 429 },
      );
      tooMany.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return withSecurityHeaders(tooMany);
    }

    const authContext = await authenticateRequest(request.headers.get("authorization"));
    if (!authContext) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          },
          { status: 401 },
        ),
      );
    }

    const requiredRole = requiredRoleFor(request);
    if (!hasRequiredRole(authContext.role, requiredRole)) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            error: "Forbidden",
            code: "FORBIDDEN",
          },
          { status: 403 },
        ),
      );
    }

    const requestHeaders = new Headers(baseRequestHeaders);
    requestHeaders.set("x-mclucy-user-id", authContext.subject);
    requestHeaders.set("x-mclucy-user-role", authContext.role);

    return withSecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
    );
  }

  return withSecurityHeaders(
    NextResponse.next({
      request: {
        headers: baseRequestHeaders,
      },
    }),
  );
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/login"],
};
