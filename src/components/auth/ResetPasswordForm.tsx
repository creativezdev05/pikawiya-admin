"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useRouter } from "@/i18n/navigation";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function ResetPasswordForm() {
  const t = useTranslations("sidebar.items.resetPassword");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg(t("passwordsDoNotMatch", { fallback: "Passwords do not match." }));
      return;
    }

    if (password.length < 6) {
      setErrorMsg(
        t("passwordLengthError", {
          fallback: "Password must be at least 6 characters long.",
        })
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg(
          t("successMsg", {
            fallback: "Password updated successfully! Redirecting to Sign In...",
          })
        );
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="no-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
              {t("title", { fallback: "Reset Password" })}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle", { fallback: "Enter your new password below." })}
            </p>
          </div>

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

          <form onSubmit={handleResetPassword}>
            <div className="space-y-5">
              {/* Password */}
              <div>
                <Label>
                  {t("newPassword", { fallback: "New Password" })}
                  <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("newPasswordPlaceholder", {
                      fallback: "Enter new password",
                    })}
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

              {/* Confirm Password */}
              <div>
                <Label>
                  {t("confirmPassword", { fallback: "Confirm Password" })}
                  <span className="text-error-500">*</span>
                </Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmPasswordPlaceholder", {
                    fallback: "Re-enter new password",
                  })}
                />
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading
                    ? t("submitting", { fallback: "Updating Password..." })
                    : t("submitBtn", { fallback: "Reset Password" })}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}