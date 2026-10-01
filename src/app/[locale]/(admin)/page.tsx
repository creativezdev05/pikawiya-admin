import DemographicCard from "@/components/ecommerce/DemographicCard";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne from "@/components/tables/BasicTableOne";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { decryptFormPayload } from "@/utils/formCrypto";


export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};
async function Forms() {
  const supabase = await createClient();

  // 1. Validate session
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    redirect("/auth/login");
  }

  // 2. Fetch raw encrypted rows from Supabase
  const { data: rawSubmissions, error: submissionsError } = await supabase.rpc(
    "get_raw_form_submissions"
  );

  if (submissionsError) {
    console.error("Failed to fetch submissions:", submissionsError);
  }
  // 3. Decrypt payload using node:crypto (AES-256-GCM)
  const decryptedSubmissions = (rawSubmissions || []).map((sub: any) => {
    let decryptedData: Record<string, unknown> | null = null;
    let decryptionFailed = false;

    if (sub.payload_ciphertext) {
      try {
        decryptedData = decryptFormPayload<Record<string, unknown>>(
          sub.payload_ciphertext
        );
      } catch (err) {
        console.error(`Decryption failed for submission ${sub.id}:`, err);
        decryptionFailed = true;
      }
    }

    return {
      ...sub,
      decryptedData,
      decryptionFailed,
    };
  });
  return (
    <div>
        {submissionsError ? (
          <p className="text-sm text-error-500">
            Error loading submissions: {submissionsError.message}
          </p>
        ) : decryptedSubmissions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No submissions found.</p>
        ) : (
          <>
            <PageBreadcrumb pageTitle="Submitted Forms" />
            <div className="space-y-6 ">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xl dark:border-gray-800 dark:bg-white/3 sm:p-6">
                <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                  Submitted Forms
                </h3>
                <BasicTableOne data={decryptedSubmissions} />
              </div>
            </div>
          </>
        )}
      </div>
  );
}

export default async function  Ecommerce() {

  return (
    <Forms/>
      
    
  );
}
