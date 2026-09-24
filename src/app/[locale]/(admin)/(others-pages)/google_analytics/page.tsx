// app/admin/analytics/page.tsx
import { getAnalyticsSummary } from "@/app/actions/analytics";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";

export default async function AnalyticsAdminPage() {
  const data = await getAnalyticsSummary();

  if (!data) {
    return (
      <div className="p-6 text-red-500">
        Failed to load Google Analytics data. Check server logs and credentials.
      </div>
    );
  }

  const { summary, dailyTrend, topPages, trafficSources, devices } = data;

  const stats = [
    { name: "Active Users (30d)", value: summary.activeUsers.toLocaleString() },
    { name: "Page Views (30d)", value: summary.pageViews.toLocaleString() },
    { name: "Total Sessions", value: summary.sessions.toLocaleString() },
    {
      name: "Avg. Session Duration",
      value: (summary.avgSessionDuration / 60).toFixed(1) + " min",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Analytics Overview
        </h1>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last 30 Days Data
        </span>
      </div>

      {/* Summary Stat Cards */}
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
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recharts Visualizations */}
      <AnalyticsCharts
        dailyTrend={dailyTrend}
        devices={devices}
        trafficSources={trafficSources}
      />

      {/* Top Pages Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">
          Most Viewed Pages
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-700 dark:border-gray-800 dark:text-gray-300">
              <tr>
                <th className="py-3 px-4">Page Path</th>
                <th className="py-3 px-4 text-right">Views</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((page, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-white/5"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {page.path}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-800 dark:text-white">
                    {page.views.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}