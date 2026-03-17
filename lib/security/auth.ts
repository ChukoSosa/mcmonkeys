import { jwtVerify } from "jose/jwt/verify";

const encoder = new TextEncoder();

export type AuthRole = "viewer" | "operator" | "admin";

export interface AuthContext {
  subject: string;
  role: AuthRole;
}

const ROLE_PRIORITY: Record<AuthRole, number> = {
  viewer: 1,
  operator: 2,
  admin: 3,
};

function isAuthEnabled() {
  if (process.env.MISSION_CONTROL_AUTH_ENABLED) {
    return process.env.MISSION_CONTROL_AUTH_ENABLED === "true";
  }

  return process.env.NODE_ENV === "production";
}

function normalizeRole(value: unknown): AuthRole {
  if (value === "admin") return "admin";
  if (value === "operator") return "operator";
  return "viewer";
}

function parseBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token;
}

function parseStaticToken(token: string): AuthContext | null {
  const staticToken = process.env.MISSION_CONTROL_API_TOKEN;
  if (!staticToken || token !== staticToken) {
    return null;
  }

  const role = normalizeRole(process.env.MISSION_CONTROL_API_TOKEN_ROLE);
  return {
    subject: process.env.MISSION_CONTROL_API_TOKEN_SUBJECT ?? "api-token",
    role,
  };
}

async function parseJwtToken(token: string): Promise<AuthContext | null> {
  const secret = process.env.MISSION_CONTROL_JWT_SECRET;
  if (!secret) return null;

  try {
    const issuer = process.env.MISSION_CONTROL_JWT_ISSUER;
    const audience = process.env.MISSION_CONTROL_JWT_AUDIENCE;

    const { payload } = await jwtVerify(token, encoder.encode(secret), {
      algorithms: ["HS256"],
      issuer: issuer || undefined,
      audience: audience || undefined,
    });

    const subject = payload.sub;
    if (!subject) return null;

    return {
      subject,
      role: normalizeRole(payload.role),
    };
  } catch {
    return null;
  }
}

export async function authenticateRequest(authHeader: string | null): Promise<AuthContext | null> {
  if (!isAuthEnabled()) {
    return {
      subject: "dev-mode",
      role: "admin",
    };
  }

  const token = parseBearerToken(authHeader);
  if (!token) return null;

  const staticAuth = parseStaticToken(token);
  if (staticAuth) return staticAuth;

  return parseJwtToken(token);
}

export function hasRequiredRole(userRole: AuthRole, requiredRole: AuthRole): boolean {
  return ROLE_PRIORITY[userRole] >= ROLE_PRIORITY[requiredRole];
}