// app/actions/analytics.ts
"use server";

import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { unstable_cache } from "next/cache";
import path from "path";
import fs from "fs";

function getClientOptions() {
  const jsonPath = path.join(process.cwd(), "pikawiya-service.json");

  // 1. Local environment: Use local JSON keyfile if present on disk
  if (fs.existsSync(jsonPath)) {
    return { keyFilename: jsonPath };
  }

  // 2. Production/Serverless: Fallback to Base64 environment variable
  const base64Key = process.env.GA_PRIVATE_KEY_BASE64?.trim();
  if (base64Key) {
    const decodedKey = Buffer.from(base64Key, "base64").toString("utf-8");
    return {
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL?.trim(),
        private_key: decodedKey,
      },
    };
  }

  console.error("GA4 Client Error: No valid local keyfile or GA_PRIVATE_KEY_BASE64 found.");
  return {};
}

const analyticsDataClient = new BetaAnalyticsDataClient(getClientOptions());

// async function fetchAnalyticsSummary() {
//   const propertyId = process.env.GA_PROPERTY_ID?.trim();

//   if (!propertyId) {
//     console.error("GA4 Error: GA_PROPERTY_ID is missing.");
//     return null;
//   }

//   try {
//     const [response] = await analyticsDataClient.runReport({
//       property: `properties/${propertyId}`,
//       dateRanges: [
//         {
//           startDate: "30daysAgo",
//           endDate: "today",
//         },
//       ],
//       metrics: [
//         { name: "activeUsers" },
//         { name: "screenPageViews" },
//         { name: "sessions" },
//         { name: "averageSessionDuration" },
//       ],
//     });

//     const metricValues = response.rows?.[0]?.metricValues || [];

//     return {
//       activeUsers: metricValues[0]?.value || "0",
//       pageViews: metricValues[1]?.value || "0",
//       sessions: metricValues[2]?.value || "0",
//       avgSessionDuration: Math.round(Number(metricValues[3]?.value || 0)),
//     };
//   } catch (error) {
//     console.error("Error fetching GA4 data in production:", error);
//     return null;
//   }
// }
async function fetchAnalyticsSummary() {
  const propertyId = process.env.GA_PROPERTY_ID?.trim();

  if (!propertyId) {
    console.error("GA4 Error: GA_PROPERTY_ID is missing.");
    return null;
  }

  try {
    // Run batch requests to fetch summary, daily trend, top pages, traffic sources & device breakdown
    const [response] = await analyticsDataClient.batchRunReports({
      property: `properties/${propertyId}`,
      requests: [
        // 1. Overall Summary Stats
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          metrics: [
            { name: "activeUsers" },
            { name: "screenPageViews" },
            { name: "sessions" },
            { name: "averageSessionDuration" },
          ],
        },
        // 2. Daily Trend (For Recharts Line/Area Chart)
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "activeUsers" },
            { name: "screenPageViews" },
          ],
          orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        },
        // 3. Top Pages
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          limit: 5,
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        },
        // 4. Traffic Sources
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "sessionSource" }],
          metrics: [{ name: "sessions" }],
          limit: 5,
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        },
        // 5. Device Categories
        {
          dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "activeUsers" }],
        },
      ],
    });

    const reports = response.reports || [];

    // Parse Summary
    const summaryRow = reports[0]?.rows?.[0]?.metricValues || [];
    const summary = {
      activeUsers: Number(summaryRow[0]?.value || 0),
      pageViews: Number(summaryRow[1]?.value || 0),
      sessions: Number(summaryRow[2]?.value || 0),
      avgSessionDuration: Math.round(Number(summaryRow[3]?.value || 0)),
    };

    // Parse Daily Trend Data
    const dailyTrend = (reports[1]?.rows || []).map((row) => {
      const rawDate = row.dimensionValues?.[0]?.value || "";
      // Convert YYYYMMDD to formatted string "MMM DD" (e.g. Sep 23)
      const formattedDate = rawDate
        ? new Date(
            `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
          ).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : rawDate;

      return {
        date: formattedDate,
        Users: Number(row.metricValues?.[0]?.value || 0),
        Views: Number(row.metricValues?.[1]?.value || 0),
      };
    });

    // Parse Top Pages
    const topPages = (reports[2]?.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      views: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse Traffic Sources
    const trafficSources = (reports[3]?.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      sessions: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse Device Categories
    const devices = (reports[4]?.rows || []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || "desktop",
      value: Number(row.metricValues?.[0]?.value || 0),
    }));

    return {
      summary,
      dailyTrend,
      topPages,
      trafficSources,
      devices,
    };
  } catch (error) {
    console.error("Error fetching GA4 batch report:", error);
    return null;
  }
}

export const getAnalyticsSummary = unstable_cache(
  async () => fetchAnalyticsSummary(),
  ["ga4-analytics-summary"],
  {
    revalidate: 21600, // 6 hours
    tags: ["analytics"],
  }
);

