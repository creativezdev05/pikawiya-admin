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

// Known form event names tracked on the public site. Kept alongside a
// "contains form" match below so events fired under a new/different name
// still surface instead of silently disappearing from the report.
const KNOWN_FORM_EVENTS = [
  "submit_membership_form",
  "submit_complaint_form",
  "submit_contact_form",
  "submit_feedback_form",
  "form_submit", // Fallback for automatic GA4 enhanced-measurement tracking
];

async function fetchAnalyticsSummary() {
  const propertyId = process.env.GA_PROPERTY_ID?.trim();

  if (!propertyId) {
    console.error("GA4 Error: GA_PROPERTY_ID is missing.");
    return null;
  }

  try {
    // GA4 batchRunReports allows a MAXIMUM of 5 requests per batch call,
    // so the report is split across two batches run in parallel.
    const [batchOne, batchTwo] = await Promise.all([
      analyticsDataClient.batchRunReports({
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
              { name: "newUsers" },
              { name: "bounceRate" },
              { name: "engagementRate" },
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
          // 5. Form Submissions Breakdown — matches known event names OR any
          // event whose name contains "form", so differently-named form
          // events (e.g. a newly added form) still show up.
          {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
            dimensionFilter: {
              orGroup: {
                expressions: [
                  {
                    filter: {
                      fieldName: "eventName",
                      inListFilter: { values: KNOWN_FORM_EVENTS },
                    },
                  },
                  {
                    filter: {
                      fieldName: "eventName",
                      stringFilter: {
                        matchType: "CONTAINS",
                        value: "form",
                        caseSensitive: false,
                      },
                    },
                  },
                ],
              },
            },
            limit: 15,
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          },
        ],
      }),
      analyticsDataClient.batchRunReports({
        property: `properties/${propertyId}`,
        requests: [
          // 6. Device Category Breakdown
          {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "activeUsers" }],
            limit: 5,
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          },
          // 7. Country Breakdown
          {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "country" }],
            metrics: [{ name: "activeUsers" }],
            limit: 5,
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          },
          // 8. New vs Returning Users
          {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "newVsReturning" }],
            metrics: [{ name: "activeUsers" }],
            orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          },
          // 9. Landing Pages
          {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "landingPage" }],
            metrics: [{ name: "sessions" }],
            limit: 5,
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          },
          // 10. All Events (diagnostic, unfiltered) — lets the dashboard
          // show every event GA4 is actually receiving, so a form event
          // fired under an unexpected name is still visible somewhere.
          {
            dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
            limit: 15,
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          },
        ],
      }),
    ]);

    const reports = batchOne[0].reports || [];
    const reports2 = batchTwo[0].reports || [];

    console.log("Reports here", reports, reports2);

    // Parse Summary (Request 0)
    const summaryRow = reports[0]?.rows?.[0]?.metricValues || [];
    const summary = {
      activeUsers: Number(summaryRow[0]?.value || 0),
      pageViews: Number(summaryRow[1]?.value || 0),
      sessions: Number(summaryRow[2]?.value || 0),
      avgSessionDuration: Math.round(Number(summaryRow[3]?.value || 0)),
      newUsers: Number(summaryRow[4]?.value || 0),
      bounceRate: Math.round(Number(summaryRow[5]?.value || 0) * 1000) / 10,
      engagementRate: Math.round(Number(summaryRow[6]?.value || 0) * 1000) / 10,
    };

    // Parse Daily Trend Data (Request 1)
    const dailyTrend = (reports[1]?.rows || []).map((row) => {
      const rawDate = row.dimensionValues?.[0]?.value || "";
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

    // Parse Top Pages (Request 2)
    const topPages = (reports[2]?.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      views: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse Traffic Sources (Request 3)
    const trafficSources = (reports[3]?.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "(direct)",
      sessions: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse Form Submissions Data (Request 4)
    const formSubmissions = (reports[4]?.rows || []).map((row) => {
      const rawEvent = row.dimensionValues?.[0]?.value || "";
      return {
        eventName: rawEvent,
        label: formatFormLabel(rawEvent),
        count: Number(row.metricValues?.[0]?.value || 0),
      };
    });

    // Parse Device Category Breakdown (Batch 2, Request 0)
    const deviceBreakdown = (reports2[0]?.rows || []).map((row) => ({
      device: row.dimensionValues?.[0]?.value || "unknown",
      users: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse Country Breakdown (Batch 2, Request 1)
    const countryBreakdown = (reports2[1]?.rows || []).map((row) => ({
      country: row.dimensionValues?.[0]?.value || "(not set)",
      users: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse New vs Returning Users (Batch 2, Request 2)
    const newVsReturning = (reports2[2]?.rows || []).map((row) => ({
      type: row.dimensionValues?.[0]?.value || "(not set)",
      users: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse Landing Pages (Batch 2, Request 3)
    const landingPages = (reports2[3]?.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      sessions: Number(row.metricValues?.[0]?.value || 0),
    }));

    // Parse All Events — diagnostic list of every event GA4 received, so
    // forms firing under an unexpected event name are still visible.
    const allEvents = (reports2[4]?.rows || []).map((row) => ({
      eventName: row.dimensionValues?.[0]?.value || "",
      count: Number(row.metricValues?.[0]?.value || 0),
    }));

    return {
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
    };
  } catch (error) {
    console.error("Error fetching GA4 batch report:", error);
    return null;
  }
}

// Helper function to map GA4 event names to readable titles
function formatFormLabel(eventName: string): string {
  switch (eventName) {
    case "submit_membership_form":
      return "Membership Forms";
    case "submit_complaint_form":
      return "Complaint Forms";
    case "submit_contact_form":
      return "Contact Forms";
    case "submit_feedback_form":
      return "Feedback Forms";
    case "form_submit":
      return "General Form Submissions";
    default:
      // Unrecognized "*form*" event (e.g. a newly added form) — prettify
      // the raw event name instead of hiding it in a generic bucket.
      return eventName
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export const getAnalyticsSummary = unstable_cache(
  async () => fetchAnalyticsSummary(),
  ["ga4-analytics-summary"],
  {
    revalidate: 1, // 6 hours (21,600 seconds)
    tags: ["analytics"],
  }
);