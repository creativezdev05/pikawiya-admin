// components/admin/AnalyticsStatCard.tsx
import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";

export interface AnalyticsStatCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  tone?: "brand" | "success" | "error";
}

const TONE_BADGE_CLASSES: Record<NonNullable<AnalyticsStatCardProps["tone"]>, string> = {
  brand: "bg-brand-50 dark:bg-brand-500/15",
  success: "bg-success-50 dark:bg-success-500/15",
  error: "bg-error-50 dark:bg-error-500/15",
};

export default function AnalyticsStatCard({
  label,
  value,
  description,
  icon,
  trend,
  tone = "brand",
}: AnalyticsStatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-400 bg-white p-5 shadow-theme-xl dark:border-gray-700 dark:bg-white/3">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${TONE_BADGE_CLASSES[tone]}`}
        >
          {icon}
        </div>
        {trend && (
          <Badge color={trend === "up" ? "success" : "error"} size="sm">
            {trend === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
          </Badge>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
        {label}
      </p>
      <p className="mt-1 text-title-sm font-bold text-gray-900 dark:text-white/90">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
