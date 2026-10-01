"use client";

import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

const activeLinkClass =
  "rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600";
const inactiveLinkClass =
  "rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/5";

export default function AuthHeader() {
  const t = useTranslations("authLayout.header");
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-gray-800 bg-gray-900">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            width={150}
            height={40}
            src="/images/logo/pika_wiya_logo.png"
            alt="Pika Wiya Health Service"
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className={pathname === "/signin" ? activeLinkClass : inactiveLinkClass}
          >
            {t("signIn")}
          </Link>
          <Link
            href="/signup"
            className={pathname === "/signup" ? activeLinkClass : inactiveLinkClass}
          >
            {t("signUp")}
          </Link>
        </div>
      </div>
    </header>
  );
}
