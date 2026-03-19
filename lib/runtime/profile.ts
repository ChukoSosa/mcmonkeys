export type RuntimeProfile = "local-dev" | "online-demo" | "install-local";

export interface RuntimePolicy {
  profile: RuntimeProfile;
  isLocalDev: boolean;
  isOnlineDemo: boolean;
  isInstallLocal: boolean;
  usesMockDataSource: boolean;
  useStaticMockData: boolean;
  useApiMockStore: boolean;
  isReadOnly: boolean;
  requiresLicense: boolean;
  shouldShowWebPages: boolean;
  shouldRunInitialization: boolean;
  shouldRequireWorkspaceSetup: boolean;
  devLicenseMode: "bypass" | "accept-any" | "strict";
}

const RAILWAY_PUBLIC_HOST = "mcmonkeys.up.railway.app";
const VALID_RUNTIME_PROFILES: RuntimeProfile[] = ["local-dev", "online-demo", "install-local"];
const LEGACY_FALLBACK_ENV = "NEXT_PUBLIC_ALLOW_LEGACY_PROFILE_FALLBACK";
let hasLoggedLegacyFallbackWarning = false;

function parseBooleanEnv(value?: string): boolean {
  return value === "true";
}

function parseRuntimeProfile(value?: string): RuntimeProfile | null {
  if (!value) return null;
  return VALID_RUNTIME_PROFILES.includes(value as RuntimeProfile)
    ? (value as RuntimeProfile)
    : null;
}

function shouldUseLegacyFallback(): boolean {
  return parseBooleanEnv(process.env[LEGACY_FALLBACK_ENV]);
}

function buildRuntimeProfileError(value?: string): Error {
  const validProfiles = VALID_RUNTIME_PROFILES.join(", ");
  const received = value ? `Received: \"${value}\".` : "No value was provided.";

  return new Error(
    `Invalid runtime profile configuration. Set NEXT_PUBLIC_RUNTIME_PROFILE to one of: ${validProfiles}. ${received} ` +
      `If you need temporary backward compatibility, set ${LEGACY_FALLBACK_ENV}=true.`,
  );
}

function logLegacyFallbackWarning(value?: string) {
  if (hasLoggedLegacyFallbackWarning) return;
  hasLoggedLegacyFallbackWarning = true;

  const received = value ? `NEXT_PUBLIC_RUNTIME_PROFILE=\"${value}\"` : "NEXT_PUBLIC_RUNTIME_PROFILE is missing";
  console.warn(
    `[runtime-profile] Using legacy fallback mode because ${LEGACY_FALLBACK_ENV}=true. ` +
      `${received}. Please set NEXT_PUBLIC_RUNTIME_PROFILE to one of: ${VALID_RUNTIME_PROFILES.join(", ")}.`,
  );
}

function parseDevLicenseMode(value?: string): RuntimePolicy["devLicenseMode"] {
  if (value === "accept-any" || value === "strict") {
    return value;
  }

  return "bypass";
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().split(":")[0] ?? "";
}

export function isLocalHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return normalized === "localhost" || normalized === "127.0.0.1";
}

export function isRailwayPublicHost(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);

  if (!normalized) return false;
  if (normalized === RAILWAY_PUBLIC_HOST) return true;

  return normalized === "railway.app" || normalized.endsWith(".railway.app");
}

export function resolveRuntimeProfile(hostname?: string): RuntimeProfile {
  const configuredValue = process.env.NEXT_PUBLIC_RUNTIME_PROFILE;
  const configuredProfile = parseRuntimeProfile(configuredValue);
  if (configuredProfile) {
    return configuredProfile;
  }

  if (!shouldUseLegacyFallback()) {
    throw buildRuntimeProfileError(configuredValue);
  }

  logLegacyFallbackWarning(configuredValue);

  if (
    parseBooleanEnv(process.env.MISSION_CONTROL_DEMO_MODE) ||
    parseBooleanEnv(process.env.NEXT_PUBLIC_MISSION_CONTROL_DEMO_MODE)
  ) {
    return "online-demo";
  }

  if (parseBooleanEnv(process.env.APP_ONLY_INSTALL) || parseBooleanEnv(process.env.NEXT_PUBLIC_APP_ONLY_INSTALL)) {
    return "install-local";
  }

  if (parseBooleanEnv(process.env.NEXT_PUBLIC_USE_MOCK_DATA)) {
    return "local-dev";
  }

  if (hostname && isRailwayPublicHost(hostname)) {
    return "online-demo";
  }

  if (hostname && isLocalHost(hostname)) {
    return "install-local";
  }

  return process.env.NODE_ENV === "production" ? "install-local" : "local-dev";
}

export function getRuntimePolicy(hostname?: string): RuntimePolicy {
  const profile = resolveRuntimeProfile(hostname);
  const isLocalDev = profile === "local-dev";
  const isOnlineDemo = profile === "online-demo";
  const isInstallLocal = profile === "install-local";
  const devLicenseMode = parseDevLicenseMode(process.env.NEXT_PUBLIC_DEV_LICENSE_MODE);

  return {
    profile,
    isLocalDev,
    isOnlineDemo,
    isInstallLocal,
    usesMockDataSource: !isInstallLocal,
    useStaticMockData: isOnlineDemo,
    useApiMockStore: isLocalDev,
    isReadOnly: isOnlineDemo,
    requiresLicense: isInstallLocal,
    shouldShowWebPages: !isInstallLocal,
    shouldRunInitialization: isInstallLocal,
    shouldRequireWorkspaceSetup: isInstallLocal,
    devLicenseMode,
  };
}

export function shouldBlockWebExperience(hostname?: string): boolean {
  return !getRuntimePolicy(hostname).shouldShowWebPages;
}
