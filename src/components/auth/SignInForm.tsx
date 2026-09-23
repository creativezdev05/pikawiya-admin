"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function SignInForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [requireOtp, setRequireOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

 const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErrorMsg(null);
  setInfoMsg(null);

  const supabase = createClient();

  // -------------------------------------------------------------
  // STEP A: OTP Verification Mode (Already triggered or 3+ failed attempts)
  // -------------------------------------------------------------
  if (requireOtp) {
    if (!otpToken) {
      setErrorMsg("Please enter the 6-digit verification code sent to your email.");
      setLoading(false);
      return;
    }

    const { error: otpError } = await supabase.auth.verifyOtp({
      email,
      token: otpToken,
      type: "email",
    });

    if (otpError) {
      setErrorMsg("Invalid or expired code. Please try again.");
      setLoading(false);
      return;
    }

    // Reset failed attempts tracker upon successful OTP sign-in
    await supabase.from("login_attempts").delete().eq("email", email);

    router.push("/");
    router.refresh();
    return;
  }

  // -------------------------------------------------------------
  // STEP B: Pre-flight Check for Existing Lockout/OTP Flag
  // -------------------------------------------------------------
  const { data: attemptData } = await supabase
    .from("login_attempts")
    .select("failed_count, otp_required")
    .eq("email", email)
    .maybeSingle();

  const currentFailedCount = attemptData?.failed_count ?? 0;

  // If account is already flagged for OTP before submitting password
  if (attemptData?.otp_required || currentFailedCount >= 3) {
    setRequireOtp(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setInfoMsg("Too many failed attempts. A 6-digit verification code was sent to your email.");
    setLoading(false);
    return;
  }

  // -------------------------------------------------------------
  // STEP C: Standard Password Login Attempt
  // -------------------------------------------------------------
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError) {
    if (authError.message.toLowerCase().includes("invalid login credentials")) {
      
     // Call the security definer RPC function instead of querying profiles directly
      const { data: emailExists } = await supabase.rpc("check_email_exists", {
        lookup_email: email,
      });
      // 2. ONLY proceed with lockout/OTP tracking if the user actually exists
      if (emailExists) {
        const newFailedCount = currentFailedCount + 1;
        const shouldTriggerOtp = newFailedCount >= 3;

        await supabase.from("login_attempts").upsert(
          {
            email,
            failed_count: newFailedCount,
            otp_required: shouldTriggerOtp,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

        if (shouldTriggerOtp) {
          setRequireOtp(true);
          await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false },
          });
          setInfoMsg(
            "3 consecutive failed attempts detected. A 6-digit verification code has been sent to your email."
          );
          setLoading(false);
          return;
        }

        setErrorMsg(
          `Invalid credentials. ${3 - newFailedCount} attempt(s) remaining before email verification is required.`
        );
      } else {
        // User doesn't exist - show generic error without touching login_attempts table
        setErrorMsg("Invalid login credentials.");
      }
    } else {
      setErrorMsg(authError.message);
    }

    setLoading(false);
    return;
  }

  const user = authData.user;
  if (!user) {
    setErrorMsg("Authentication failed. User missing.");
    setLoading(false);
    return;
  }

  // -------------------------------------------------------------
  // STEP D: Cleanup & Profile Verification
  // -------------------------------------------------------------
  // Clear attempt tracking for this email on success
  await supabase.from("login_attempts").delete().eq("email", email);

  // Fetch user role from profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    setErrorMsg("Failed to load user profile.");
    setLoading(false);
    return;
  }

  router.push("/");
  router.refresh();
};

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {requireOtp
                ? "Enter the 6-digit code sent to your email to complete sign in."
                : "Enter your email and password to sign in!"}
            </p>
          </div>
          <div>
            {!requireOtp && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                  <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                        fill="#EB4335"
                      />
                    </svg>
                    Sign in with Google
                  </button>
                  <button className="inline-flex items-center justify-center gap-3 rounded-lg bg-gray-100 px-7 py-3 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                    <svg
                      width="21"
                      className="fill-current"
                      height="20"
                      viewBox="0 0 21 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                    </svg>
                    Sign in with X
                  </button>
                </div>
                <div className="relative py-3 sm:py-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white p-2 text-gray-400 sm:px-5 sm:py-2 dark:bg-gray-900">
                      Or
                    </span>
                  </div>
                </div>
              </>
            )}

            {infoMsg && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-600 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                {infoMsg}
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignIn}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    required
                    disabled={requireOtp}
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {!requireOtp ? (
                  <div>
                    <Label>
                      Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="inset-e-4 absolute top-1/2 z-30 -translate-y-1/2 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>
                      Verification Code <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      required
                      placeholder="Enter 6-digit email code"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                    />
                  </div>
                )}

                {!requireOtp && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isChecked} onChange={setIsChecked} />
                      <span className="block text-theme-sm font-normal text-gray-700 dark:text-gray-400">
                        Keep me logged in
                      </span>
                    </div>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <div>
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading
                      ? requireOtp
                        ? "Verifying Code..."
                        : "Signing in..."
                      : requireOtp
                      ? "Verify Email Code"
                      : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}