import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { authenticateRequest, hasRequiredRole } from "@/lib/security/auth";

const originalEnv = { ...process.env };

describe("auth", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns dev-mode admin when auth is disabled", async () => {
    process.env.MISSION_CONTROL_AUTH_ENABLED = "false";

    const result = await authenticateRequest(null);

    expect(result).toEqual({
      subject: "dev-mode",
      role: "admin",
    });
  });

  it("authenticates static API token when auth is enabled", async () => {
    process.env.MISSION_CONTROL_AUTH_ENABLED = "true";
    process.env.MISSION_CONTROL_API_TOKEN = "super-secret";
    process.env.MISSION_CONTROL_API_TOKEN_ROLE = "operator";
    process.env.MISSION_CONTROL_API_TOKEN_SUBJECT = "integration-user";

    const result = await authenticateRequest("Bearer super-secret");

    expect(result).toEqual({
      subject: "integration-user",
      role: "operator",
    });
  });

  it("authenticates JWT when static token is absent", async () => {
    process.env.MISSION_CONTROL_AUTH_ENABLED = "true";
    process.env.MISSION_CONTROL_JWT_SECRET = "jwt-secret";
    process.env.MISSION_CONTROL_JWT_ISSUER = "mc-lucy";
    process.env.MISSION_CONTROL_JWT_AUDIENCE = "mission-control";

    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("jwt-user")
      .setIssuer("mc-lucy")
      .setAudience("mission-control")
      .setExpirationTime("10m")
      .sign(new TextEncoder().encode("jwt-secret"));

    const result = await authenticateRequest(`Bearer ${token}`);
    expect(result).toEqual({
      subject: "jwt-user",
      role: "admin",
    });
  });

  it("returns null for invalid token when auth is enabled", async () => {
    process.env.MISSION_CONTROL_AUTH_ENABLED = "true";
    process.env.MISSION_CONTROL_API_TOKEN = "expected";

    const result = await authenticateRequest("Bearer invalid");
    expect(result).toBeNull();
  });

  it("enforces role hierarchy correctly", () => {
    expect(hasRequiredRole("admin", "operator")).toBe(true);
    expect(hasRequiredRole("operator", "viewer")).toBe(true);
    expect(hasRequiredRole("viewer", "operator")).toBe(false);
  });
});