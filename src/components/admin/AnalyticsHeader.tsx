// components/admin/AnalyticsHeader.tsx
import GridShape from "@/components/common/GridShape";
import { CalenderIcon } from "@/icons";

export default function AnalyticsHeader() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-950 p-6 dark:bg-white/5 sm:p-8">
      <GridShape />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Google Analytics Overview
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-gray-300">
            A live snapshot of your site&apos;s traffic, audience, and
            conversions from Google Analytics 4 — showing who&apos;s
            visiting, how they found you, and what they did once they
            arrived.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
          <CalenderIcon className="size-3.5" />
          Last 30 Days
        </span>
      </div>
    </div>
  );
}
