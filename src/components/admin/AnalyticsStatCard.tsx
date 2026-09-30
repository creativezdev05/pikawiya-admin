// components/admin/AnalyticsStatCard.tsx
import Badge from "@/components/ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";

export interface AnalyticsStatCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
}

export default function AnalyticsStatCard({
  label,
  value,
  description,
  icon,
  trend,
}: AnalyticsStatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-300 p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          {icon}
        </div>
        {trend && (
          <Badge color={trend === "up" ? "success" : "error"} size="sm">
            {trend === "up" ? <ArrowUpIcon /> : <ArrowDownIcon />}
          </Badge>
        )}
      </div>
      <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
        {value}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
        {description}
      </p>
    </div>
  );
}
