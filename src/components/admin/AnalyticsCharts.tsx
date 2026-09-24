// components/admin/AnalyticsCharts.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import LineChartOne from "@/components/charts/line/LineChartOne";
import BarChartOne from "@/components/charts/bar/BarChartOne";
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

interface AnalyticsChartsProps {
  dailyTrend: { date: string; Users: number; Views: number }[];
  devices: { name: string; value: number }[];
  trafficSources: { source: string; sessions: number }[];
}

export default function AnalyticsCharts({
  dailyTrend,
  devices,
  trafficSources,
}: AnalyticsChartsProps) {
	// 1. Transform dailyTrend -> ApexCharts format (Line / Area Chart)
	console.log("trafficSources", trafficSources)
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
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Main Trend Chart (Spans 2 columns) */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5 lg:col-span-2">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">
          Traffic Over Time (30 Days)
        </h3>
        <div className="h-72 w-full">
          {/* <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#888888" />
              <YAxis tick={{ fontSize: 12 }} stroke="#888888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="Views"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorViews)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Users"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorUsers)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer> */}
					<LineChartOne categories={lineCategories} series={lineSeries} />
        </div>
      </div>

      {/* 2. Device Breakdown Pie Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">
          Devices
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={devices}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {devices.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {devices.map((device, idx) => (
            <div key={device.name} className="flex items-center gap-1.5 capitalize">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              {device.name}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Top Traffic Sources Bar Chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5 lg:col-span-3">
        <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white">
          Top Acquisition Sources
        </h3>
        <div className="h-60 w-full">
          {/* <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trafficSources} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#888888" />
              <YAxis
                dataKey="source"
                type="category"
                tick={{ fontSize: 12 }}
                stroke="#888888"
                width={100}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  borderColor: "#374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="sessions" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer> */}
					<BarChartOne categories={barCategories} series={barSeries} />
        </div>
      </div>
    </div>
  );
}