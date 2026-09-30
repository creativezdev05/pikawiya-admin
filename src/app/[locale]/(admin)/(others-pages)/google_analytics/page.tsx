// app/admin/analytics/page.tsx
import { getAnalyticsSummary } from "@/app/actions/analytics";
import AnalyticsCharts from "@/components/admin/AnalyticsCharts";
import AnalyticsHeader from "@/components/admin/AnalyticsHeader";
import AnalyticsStatCard from "@/components/admin/AnalyticsStatCard";
import FormSubmissionsCard from "@/components/admin/FormSubmissionsCard";
import BreakdownCard from "@/components/admin/BreakdownCard";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoltIcon,
  EyeIcon,
  GroupIcon,
  TimeIcon,
  UserIcon,
} from "@/icons";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google Analytics | Pikawiya Admin",
  description: "Traffic, audience, and conversion overview from Google Analytics 4.",
};

export default async function AnalyticsAdminPage() {
  const data = await getAnalyticsSummary();

  if (!data) {
    return (
      <div className="p-6 text-red-500">
        Failed to load Google Analytics data. Check server logs and credentials.
      </div>
    );
  }

  const {
    summary,
    dailyTrend,
    topPages,
    trafficSources,
    formSubmissions,
    deviceBreakdown,
    countryBreakdown,
    newVsReturning,
    landingPages,
    allEvents,
  } = data;

  const stats: {
    name: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    trend?: "up" | "down";
  }[] = [
    {
      name: "Active Users (30d)",
      value: summary.activeUsers.toLocaleString(),
      description: "Unique visitors who used your site in the last 30 days.",
      icon: <GroupIcon className="size-5 text-gray-800 dark:text-white/90" />,
    },
    {
      name: "Page Views (30d)",
      value: summary.pageViews.toLocaleString(),
      description: "Total pages loaded across all visitor sessions.",
      icon: <EyeIcon className="size-5 text-gray-800 dark:text-white/90" />,
    },
    {
      name: "Total Sessions",
      value: summary.sessions.toLocaleString(),
      description: "Total visits, including repeat visits from the same user.",
      icon: <BoltIcon className="size-5 text-gray-800 dark:text-white/90" />,
    },
    {
      name: "Avg. Session Duration",
      value: (summary.avgSessionDuration / 60).toFixed(1) + " min",
      description: "Average time a visitor spends per session.",
      icon: <TimeIcon className="size-5 text-gray-800 dark:text-white/90" />,
    },
    {
      name: "New Users (30d)",
      value: summary.newUsers.toLocaleString(),
      description: "First-time visitors with no prior recorded session.",
      icon: <UserIcon className="size-5 text-gray-800 dark:text-white/90" />,
    },
    {
      name: "Bounce Rate",
      value: summary.bounceRate.toFixed(1) + "%",
      description:
        "Sessions that left without further interaction. Lower is better.",
      icon: <ArrowDownIcon className="size-5 text-gray-800 dark:text-white/90" />,
      trend: "down",
    },
    {
      name: "Engagement Rate",
      value: summary.engagementRate.toFixed(1) + "%",
      description:
        "Sessions with meaningful interaction. Higher is better.",
      icon: <ArrowUpIcon className="size-5 text-gray-800 dark:text-white/90" />,
      trend: "up",
    },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Google Analytics" />

      {/* Hero banner: what this page is and the reporting window it covers */}
      <AnalyticsHeader />

      {/* Traffic & Engagement Overview */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Traffic &amp; Engagement Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Core visitor numbers for the last 30 days how many people came,
            how many pages they viewed, and how engaged they were once they
            arrived.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <AnalyticsStatCard
              key={stat.name}
              label={stat.name}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>
      </div>

      {/* Trend, Acquisition, Devices, Geography charts */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Traffic Trends &amp; Audience Breakdown
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            How traffic moves day to day, where it comes from, and who your
            visitors are by device and by country.
          </p>
        </div>
        <AnalyticsCharts
          dailyTrend={dailyTrend}
          trafficSources={trafficSources}
          deviceBreakdown={deviceBreakdown}
          countryBreakdown={countryBreakdown}
        />
      </div>

      {/* Conversions & Diagnostics */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Conversions &amp; Event Diagnostics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Form submissions, how many visitors are new vs. returning, and
            every event GA4 actually received use the last one to confirm a
            form is firing correctly, even if it&apos;s under an unexpected
            name.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <FormSubmissionsCard formSubmissions={formSubmissions} />
          <BreakdownCard
            title="New vs Returning Users"
            subtitle="Returning users signal loyalty and repeat engagement; new users signal reach. Past 30 days."
            items={newVsReturning.map((item) => ({
              key: item.type,
              label: item.type.replace(/_/g, " "),
              count: item.users,
            }))}
            accentClassName="bg-success-500"
          />
          <BreakdownCard
            title="All Tracked Events (Diagnostics)"
            subtitle="Every event GA4 received in the last 30 days use this to confirm a form is firing an event, even if it's under an unexpected name."
            items={allEvents.map((item) => ({
              key: item.eventName,
              label: item.eventName,
              count: item.count,
            }))}
            emptyLabel="No events recorded yet."
            accentClassName="bg-orange-500"
          />
        </div>
      </div>

      {/* Content Performance */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Content Performance
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Which pages get read the most, and which pages bring visitors in
            the door.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ComponentCard
            title="Most Viewed Pages"
            desc="Pages ranked by total pageviews in the last 30 days your most-consumed content."
            className="bg-gray-300 shadow-theme-xs"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm text-gray-500 dark:text-gray-400">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-700 dark:border-gray-800 dark:text-gray-300">
                  <tr>
                    <th className="py-3 px-4">Page Path</th>
                    <th className="py-3 px-4 text-end">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-100 dark:border-gray-800/50 dark:hover:bg-white/5"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {page.path}
                      </td>
                      <td className="py-3 px-4 text-end font-semibold text-gray-800 dark:text-white">
                        {page.views.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ComponentCard>

          <ComponentCard
            title="Top Landing Pages"
            desc="Pages where sessions most often began the first thing visitors see, key for first impressions and SEO landing performance."
            className="bg-gray-300 shadow-theme-xs"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm text-gray-500 dark:text-gray-400">
                <thead className="border-b border-gray-200 text-xs uppercase text-gray-700 dark:border-gray-800 dark:text-gray-300">
                  <tr>
                    <th className="py-3 px-4">Landing Page</th>
                    <th className="py-3 px-4 text-end">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {landingPages.map((page, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-100 dark:border-gray-800/50 dark:hover:bg-white/5"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {page.path}
                      </td>
                      <td className="py-3 px-4 text-end font-semibold text-gray-800 dark:text-white">
                        {page.sessions.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
