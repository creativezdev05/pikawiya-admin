// app/profile/page.tsx
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import DangerZone from "@/components/user-profile/DangerZone";
import Security from "@/components/user-profile/Security";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Profile | TailAdmin - Next.js Admin Dashboard Template",
  description:
    "Manage your personal information, security settings, and preference on the TailAdmin Profile page.",
};

export default async function Profile() {
  const supabase = await createClient();

  // 1. Fetch authenticated user from Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to signin if unauthenticated
  if (!user) {
    redirect("/signin");
  }

  // 2. Extract Auth Metadata / Custom Claims
  const userMetadata = user.user_metadata || {}; // full_name, avatar_url, etc.
  const appMetadata = user.app_metadata || {};   // provider, roles, custom JWT claims

  // 3. Fetch corresponding record from the 'profiles' table
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error loading user profile:", error.message);
  }

  // Consolidated user claims object
  const claims = {
    fullName: userMetadata.full_name || userMetadata.name || "",
    avatarUrl: userMetadata.avatar_url || "",
    email: user.email || "",
    role: appMetadata.role || "user",
    rawUserMetadata: userMetadata,
    rawAppMetadata: appMetadata,
  };

  // 4. Server Action for Sign Out
  async function handleSignOut() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/signin");
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 lg:mb-7 dark:text-white/90">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={user} profile={profile} claims={claims} />
          {/* <UserAddressCard user={user} profile={profile} claims={claims} /> */}
          <Security user={user} profile={profile} claims={claims} />
          <DangerZone user={user} profile={profile} claims={claims} onSignOut={handleSignOut} />
        </div>
      </div>
    </div>
  );
}