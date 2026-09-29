"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import Image from "next/image";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // Background must line up with the content area's own start edge, not the
  // full viewport, so it isn't cropped by (and doesn't shift under) the sidebar
  const bgContentStart = isMobileOpen
    ? "start-0"
    : isExpanded || isHovered
    ? "start-0 lg:start-[290px]"
    : "start-0 lg:start-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Light-theme page background: fixed image + drifting line pattern, hidden in dark mode */}
      <div
        className={`fixed inset-y-0 end-0 z-0 pointer-events-none transition-all duration-300 ease-in-out dark:hidden ${bgContentStart}`}
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

      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`relative z-10 flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
