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

async function fetchAnalyticsSummary() {
  const propertyId = process.env.GA_PROPERTY_ID?.trim();

  if (!propertyId) {
    console.error("GA4 Error: GA_PROPERTY_ID is missing.");
    return null;
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "averageSessionDuration" },
      ],
    });

    const metricValues = response.rows?.[0]?.metricValues || [];

    return {
      activeUsers: metricValues[0]?.value || "0",
      pageViews: metricValues[1]?.value || "0",
      sessions: metricValues[2]?.value || "0",
      avgSessionDuration: Math.round(Number(metricValues[3]?.value || 0)),
    };
  } catch (error) {
    console.error("Error fetching GA4 data in production:", error);
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