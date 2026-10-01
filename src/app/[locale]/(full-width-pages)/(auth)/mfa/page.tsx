"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface Factor {
  id: string;
  status: "verified" | "unverified";
  factor_type: "totp" | string;
}

export default function MFAPage() {
  const [loading, setLoading] = useState(true);
  const [enrolledFactor, setEnrolledFactor] = useState<Factor | null>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // 1. Determine user's current MFA state
  const checkMFAStatus = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: factors, error: factorsErr } =
        await supabase.auth.mfa.listFactors();

      if (factorsErr) throw factorsErr;

      // Check if user has a verified TOTP factor
      const verifiedFactor = factors.totp.find(
        (f) => f.status === "verified"
      );

      if (verifiedFactor) {
        setEnrolledFactor(verifiedFactor);
      } else {
        // No verified factor found -> Start enrollment flow
        const { data: enrollData, error: enrollErr } =
          await supabase.auth.mfa.enroll({
            factorType: "totp",
          });

        if (enrollErr) throw enrollErr;

        setFactorId(enrollData.id);
        setQrCode(enrollData.totp.qr_code);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load MFA status.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkMFAStatus();
  }, [checkMFAStatus]);

  // 2. Handle TOTP Verification (Works for both Enrollment & Challenge)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const targetFactorId = enrolledFactor ? enrolledFactor.id : factorId;

      // Step A: Create challenge
      const { data: challengeData, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId: targetFactorId });

      if (challengeErr) throw challengeErr;

      // Step B: Verify submitted code
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: targetFactorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyErr) throw verifyErr;

      // Step C: Refresh session to upgrade assurance level to AAL2
      await supabase.auth.refreshSession();

      // Redirect back to protected admin dashboard
      router.push("/protected");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed. Check your code.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
          Checking security status...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-400 bg-white p-6 shadow-theme-xl dark:border-gray-700 dark:bg-white/3 sm:p-8">
        {enrolledFactor ? (
          /* --- STATE A: OTP CHALLENGE (USER ALREADY HAS TOTP ENROLLED) --- */
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
                Two-Factor Authentication
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter the 6-digit verification code from your authenticator app
                to continue to the admin panel.
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-center font-mono text-2xl tracking-widest text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p className="text-center text-xs font-medium text-error-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          </div>
        ) : (
          /* --- STATE B: TOTP ENROLLMENT (FIRST-TIME SETUP) --- */
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
                Set Up Two-Factor Auth
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Super Administrators are required to enable MFA. Scan the QR code
                below using Google Authenticator, 1Password, or Authy.
              </p>
            </div>

            {qrCode ? (
              <div className="mx-auto w-fit rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800">
                <img
                  src={qrCode}
                  alt="MFA QR Code"
                  className="h-44 w-44 object-contain"
                />
              </div>
            ) : (
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Generating QR...</p>
              </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Enter 6-Digit Code to Confirm Setup
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-center font-mono text-2xl tracking-widest text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                  required
                />
              </div>

              {error && (
                <p className="text-center text-xs font-medium text-error-500">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? "Enrolling..." : "Activate & Continue"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}