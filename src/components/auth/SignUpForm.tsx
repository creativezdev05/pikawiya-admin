"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function SignUpForm() {
  const t = useTranslations("signUp");
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Status feedback states
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isChecked) {
      setErrorMsg(t("termsError", { fallback: "You must accept the Terms and Conditions to proceed." }));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Sign up user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // 2. Check if email confirmation is required or if a session was created immediately
      if (data.user && data.session) {
        router.push("/");
        router.refresh();
      } else {
        setSuccessMsg(
          t("successMsg", {
            fallback: "Registration successful! Please check your email to confirm your account.",
          })
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: "google" | "twitter") => {
    try {
      setOauthLoading(provider);
      setErrorMsg(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setOauthLoading(null);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "OAuth sign up failed.");
      setOauthLoading(null);
    }
  };

  return (
    <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
              {t("title", { fallback: "Sign Up" })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle", { fallback: "Enter your email and password to sign up!" })}
            </p>
          </div>
          <div>
            
            
            {errorMsg && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSignUp}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* First Name */}
                  <div className="sm:col-span-1">
                    <Label>
                      {t("firstName", { fallback: "First Name" })}
                      <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder={t("firstNamePlaceholder", {
                        fallback: "Enter your first name",
                      })}
                    />
                  </div>
                  {/* Last Name */}
                  <div className="sm:col-span-1">
                    <Label>
                      {t("lastName", { fallback: "Last Name" })}
                      <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder={t("lastNamePlaceholder", {
                        fallback: "Enter your last name",
                      })}
                    />
                  </div>
                </div>
                {/* Email */}
                <div>
                  <Label>
                    {t("email", { fallback: "Email" })}
                    <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder", {
                      fallback: "Enter your email",
                    })}
                  />
                </div>
                {/* Password */}
                <div>
                  <Label>
                    {t("password", { fallback: "Password" })}
                    <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder={t("passwordPlaceholder", {
                        fallback: "Enter your password",
                      })}
                      type={showPassword ? "text" : "password"}
                      required
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
                {/* Checkbox */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="h-5 w-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    {t("termsPrefix", { fallback: "By creating an account means you agree to the " })}
                    <span className="text-gray-800 dark:text-white/90">
                      {t("termsLink", { fallback: "Terms and Conditions," })}
                    </span>{" "}
                    {t("termsAnd", { fallback: "and our " })}
                    <span className="text-gray-800 dark:text-white">
                      {t("privacyLink", { fallback: "Privacy Policy" })}
                    </span>
                  </p>
                </div>
                {/* Submit Button */}
                <div>
                  <Button
                    className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading
                      ? t("submitting", { fallback: "Creating Account..." })
                      : t("submitBtn", { fallback: "Sign Up" })}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
                {t("alreadyHaveAccount", { fallback: "Already have an account?" })}{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  {t("signInLink", { fallback: "Sign In" })}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}