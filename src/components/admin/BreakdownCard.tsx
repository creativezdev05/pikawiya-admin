// components/admin/BreakdownCard.tsx
interface BreakdownItem {
  key: string;
  label: string;
  count: number;
}

export default function BreakdownCard({
  title,
  subtitle,
  items,
  emptyLabel = "No data recorded yet.",
  accentClassName = "bg-blue-600",
}: {
  title: string;
  subtitle?: string;
  items: BreakdownItem[];
  emptyLabel?: string;
  accentClassName?: string;
}) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="rounded-2xl border border-gray-400 bg-white p-5 shadow-theme-xl dark:border-gray-700 dark:bg-white/3">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const percentage = totalCount
              ? Math.round((item.count / totalCount) * 100)
              : 0;
            return (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {item.count.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${accentClassName}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
