"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullseye,
  faKey,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { getRuntimePolicy } from "@/lib/runtime/profile";

const LS_KEY = "mc__license_key";
const LS_VALIDATED_AT = "mc__license_validated_at";
const REVALIDATE_DAYS = 30;
const RUNTIME_POLICY = getRuntimePolicy();
const SHOULD_SHORTCUT_LICENSE_IN_DEV =
  process.env.NODE_ENV === "development" && RUNTIME_POLICY.devLicenseMode === "bypass";

function isValidationFresh(validatedAt: string | null): boolean {
  if (!validatedAt) return false;
  const age = Date.now() - new Date(validatedAt).getTime();
  return age < REVALIDATE_DAYS * 24 * 60 * 60 * 1000;
}

function readStorage(): { key: string | null; validatedAt: string | null } {
  try {
    return {
      key: localStorage.getItem(LS_KEY),
      validatedAt: localStorage.getItem(LS_VALIDATED_AT),
    };
  } catch {
    return { key: null, validatedAt: null };
  }
}

function persistValidation(key: string) {
  try {
    localStorage.setItem(LS_KEY, key);
    localStorage.setItem(LS_VALIDATED_AT, new Date().toISOString());
  } catch {
    // Ignore - localStorage unavailable (e.g. private browsing)
  }
}

async function callValidateApi(
  key: string,
): Promise<{ success: boolean; error?: string }> {
  let res: Response;
  try {
    res = await fetch("/api/license/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: key }),
    });
  } catch {
    return { success: false, error: "Could not reach the validation server. Check your connection." };
  }

  if (!res.ok) {
    return { success: false, error: "Validation server returned an error. Please try again." };
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    return { success: false, error: "Unexpected response from server." };
  }

  if (data.valid === true) return { success: true };

  const msg =
    typeof data.error === "string" && data.error.length > 0
      ? data.error
      : "Invalid license key.";
  return { success: false, error: msg };
}

interface LicenseGateProps {
  children: React.ReactNode;
}

export function LicenseGate({ children }: LicenseGateProps) {
  const demoMode = RUNTIME_POLICY.isOnlineDemo;

  // "checking"  → running localStorage / silent re-validate
  // "gate"      → showing the license input overlay
  // "open"      → valid, render children
  const [phase, setPhase] = useState<"checking" | "gate" | "open">("checking");
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (SHOULD_SHORTCUT_LICENSE_IN_DEV) {
      setPhase("open");
      return;
    }

    // Demo mode is always open (no license required)
    if (demoMode) {
      setPhase("open");
      return;
    }

    const { key, validatedAt } = readStorage();

    if (isValidationFresh(validatedAt)) {
      setPhase("open");
      return;
    }

    if (key) {
      // Silent re-validation with the stored key
      callValidateApi(key).then((result) => {
        if (result.success) {
          persistValidation(key);
          setPhase("open");
        } else {
          // Re-validation failed — show gate, pre-fill the key
          setLicenseKey(key);
          setPhase("gate");
        }
      });
      return;
    }

    setPhase("gate");
  }, [demoMode]);

  // Focus the input when the gate appears
  useEffect(() => {
    if (phase === "gate") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = licenseKey.trim();
    if (!trimmed) return;

    setIsValidating(true);
    setError(null);

    const result = await callValidateApi(trimmed);

    if (result.success) {
      persistValidation(trimmed);
      setPhase("open");
    } else {
      setError(result.error ?? "Invalid license key.");
    }

    setIsValidating(false);
  }

  if (phase === "open") return <>{children}</>;

  if (phase === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Checking license…
        </p>
      </div>
    );
  }

  // phase === "gate"
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="License activation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950"
    >
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <FontAwesomeIcon icon={faBullseye} className="text-cyan-400 text-2xl" />
          <div>
            <h1 className="text-sm font-bold tracking-widest uppercase text-slate-100">
              Mission Control
            </h1>
            <p className="text-[10px] text-slate-500">
              Operational Dashboard · Phase I
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-900 border border-surface-700 rounded-xl overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-3.5 border-b border-surface-700 flex items-center gap-2">
            <FontAwesomeIcon icon={faKey} className="text-cyan-400 text-xs" />
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              License Activation
            </h2>
          </div>

          {/* Card body */}
          <div className="p-6">
            <p className="text-sm text-slate-300 mb-1">Enter your license key</p>
            <p className="text-xs text-slate-500 mb-5">
              You received your license key via email after purchase.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={licenseKey}
                onChange={(e) => {
                  setLicenseKey(e.target.value);
                  setError(null);
                }}
                placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                spellCheck={false}
                autoComplete="off"
                disabled={isValidating}
                className="w-full bg-surface-800 border border-surface-600 rounded-lg px-4 py-3 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 disabled:opacity-50 transition-colors"
              />

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-xs">
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isValidating || !licenseKey.trim()}
                className="w-full py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-surface-950 text-sm font-semibold tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                    Validating…
                  </>
                ) : (
                  "Activate License"
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-[10px] text-slate-600">
              Need a license?{" "}
              <a
                href="https://mcmonkeys.up.railway.app/web/payment"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
              >
                Get one here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
