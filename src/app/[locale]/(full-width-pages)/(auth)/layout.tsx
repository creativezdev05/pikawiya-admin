import AuthFooter from "@/components/auth/AuthFooter";
import AuthHeader from "@/components/auth/AuthHeader";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ThemeProvider>
      <div className="relative flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        {/* Light-theme page background: fixed image + drifting line pattern, hidden in dark mode */}
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-300 ease-in-out dark:hidden"
          aria-hidden="true"
        >
          <Image
            src="/images/background/admin-bg.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 animate-drift opacity-15"
            style={{
              backgroundImage: "url('/images/background/admin-bg-pattern.png')",
              backgroundSize: "contain",
              filter:
                "brightness(0) saturate(100%) invert(96%) sepia(94%) saturate(122%) hue-rotate(32deg) brightness(116%) contrast(98%)",
            }}
          />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col">
          <AuthHeader />
          <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
            {children}
          </main>
          <AuthFooter />
        </div>
      </div>
    </ThemeProvider>
  );
}
