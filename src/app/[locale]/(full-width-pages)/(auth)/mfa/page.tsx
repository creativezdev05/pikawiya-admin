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
        <p className="text-sm text-muted-foreground animate-pulse">
          Checking security status...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md p-6 bg-card border rounded-lg shadow-sm">
        {enrolledFactor ? (
          /* --- STATE A: OTP CHALLENGE (USER ALREADY HAS TOTP ENROLLED) --- */
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Two-Factor Authentication
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
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
                  className="w-full p-3 border rounded-md text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-destructive text-center font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          </div>
        ) : (
          /* --- STATE B: TOTP ENROLLMENT (FIRST-TIME SETUP) --- */
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Set Up Two-Factor Auth
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Super Administrators are required to enable MFA. Scan the QR code
                below using Google Authenticator, 1Password, or Authy.
              </p>
            </div>

            {qrCode ? (
              <div className="flex justify-center p-3 bg-white border rounded-md w-fit mx-auto">
                <img
                  src={qrCode}
                  alt="MFA QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>
            ) : (
              <div className="w-44 h-44 bg-muted border rounded-md mx-auto flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Generating QR...</p>
              </div>
            )}

            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground text-center">
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
                  className="w-full p-3 border rounded-md text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {error && (
                <p className="text-xs text-destructive text-center font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
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