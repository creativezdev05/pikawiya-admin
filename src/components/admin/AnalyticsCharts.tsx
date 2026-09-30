// components/admin/AnalyticsCharts.tsx
"use client";

import LineChartOne from "@/components/charts/line/LineChartOne";
import BarChartOne from "@/components/charts/bar/BarChartOne";
import ComponentCard from "@/components/common/ComponentCard";

interface AnalyticsChartsProps {
  dailyTrend: { date: string; Users: number; Views: number }[];
  trafficSources: { source: string; sessions: number }[];
  deviceBreakdown: { device: string; users: number }[];
  countryBreakdown: { country: string; users: number }[];
}

export default function AnalyticsCharts({
  dailyTrend,
  trafficSources,
  deviceBreakdown,
  countryBreakdown,
}: AnalyticsChartsProps) {
  // 1. Transform dailyTrend -> ApexCharts format (Line Chart)
  const lineCategories = dailyTrend.map((item) => item.date);
  const lineSeries = [
    {
      name: "Page Views",
      data: dailyTrend.map((item) => item.Views),
    },
    {
      name: "Active Users",
      data: dailyTrend.map((item) => item.Users),
    },
  ];

  // 2. Transform trafficSources -> ApexCharts format (Bar Chart)
  const barCategories = trafficSources.map((item) => item.source);
  const barSeries = [
    {
      name: "Sessions",
      data: trafficSources.map((item) => item.sessions),
    },
  ];

  // 3. Transform deviceBreakdown -> ApexCharts format (Bar Chart)
  const deviceCategories = deviceBreakdown.map((item) => item.device);
  const deviceSeries = [
    {
      name: "Users",
      data: deviceBreakdown.map((item) => item.users),
    },
  ];

  // 4. Transform countryBreakdown -> ApexCharts format (Bar Chart)
  const countryCategories = countryBreakdown.map((item) => item.country);
  const countrySeries = [
    {
      name: "Users",
      data: countryBreakdown.map((item) => item.users),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Main Trend Chart (Spans 2 columns) */}
      <ComponentCard
        title="Traffic Over Time"
        desc="Daily active users compared with page views over the last 30 days spot growth trends, drops, or spikes tied to campaigns or new content."
        className="lg:col-span-2 bg-gray-300 shadow-theme-xs"
      >
        <div className="h-72 w-full">
          <LineChartOne categories={lineCategories} series={lineSeries} />
        </div>
      </ComponentCard>

      {/* 2. Top Traffic Sources Bar Chart */}
      <ComponentCard
        title="Where Visitors Come From"
        desc="Sessions grouped by acquisition channel organic search, direct, referral, social, or paid showing which channels bring in the most traffic."
        className="lg:col-span-3 bg-gray-300 shadow-theme-xs"
      >
        <div className="h-60 w-full">
          <BarChartOne categories={barCategories} series={barSeries} />
        </div>
      </ComponentCard>

      {/* 3. Device Breakdown Bar Chart */}
      <ComponentCard
        title="Users by Device"
        desc="Session share across desktop, mobile, and tablet use this to prioritize where responsive design and testing matter most."
        className="bg-gray-300 shadow-theme-xs"
      >
        <div className="h-60 w-full">
          <BarChartOne categories={deviceCategories} series={deviceSeries} />
        </div>
      </ComponentCard>

      {/* 4. Country Breakdown Bar Chart */}
      <ComponentCard
        title="Top Countries"
        desc="Users grouped by country shows where your audience is geographically located."
        className="lg:col-span-2 bg-gray-300 shadow-theme-xs"
      >
        <div className="h-60 w-full">
          <BarChartOne categories={countryCategories} series={countrySeries} />
        </div>
      </ComponentCard>
    </div>
  );
}
