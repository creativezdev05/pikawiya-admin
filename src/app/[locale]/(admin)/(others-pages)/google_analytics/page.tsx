// app/admin/analytics/page.tsx
import { getAnalyticsSummary } from "@/app/actions/analytics";

export default async function AnalyticsAdminPage() {
  const data = await getAnalyticsSummary();

  if (!data) {
    return (
      <div className="p-6 text-red-500">
        Failed to load Google Analytics data. Check server logs and credentials.
      </div>
    );
  }

  const stats = [
    { name: "Active Users (30d)", value: data.activeUsers },
    { name: "Page Views (30d)", value: data.pageViews },
    { name: "Total Sessions", value: data.sessions },
    { name: "Avg. Session Duration", value: data.avgSessionDuration },
  ];
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Analytics Overview
      </h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {stat.name}
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {stat.name === "Avg. Session Duration"
                ? (Number(stat.value) / 60).toLocaleString() + " min"
                : Number(stat.value).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}