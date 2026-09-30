"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createClient as  createClientAdmin} from "@supabase/supabase-js";

/**
 * STEP 1: Sends an OTP verification code to the authenticated user's email.
 */
export async function sendProfileUpdateOtp() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return { success: false, error: "Unauthorized or missing email." };
  }

  // Trigger Supabase OTP dispatch to user's registered email
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: user.email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (otpError) {
    return { success: false, error: otpError.message };
  }

  return { success: true };
}

/**
 * STEP 2: Verifies the submitted OTP token and updates the profile if valid.
 */
export async function verifyAndSaveProfile(formData: FormData, otpCode: string, avatarUrl?: string) {
  const supabase = await createClient();

  // 1. Authenticate session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  if (!otpCode) {
    return { success: false, error: "Verification code is required." };
  }
  // 2. Extract Form Data FIRST (Before verifyOtp alters active session context)
  const firstName = (formData.get("firstName") as string) || "";
  const lastName = (formData.get("lastName") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const requestedRole = formData.get("bio") as string | null;
  const finalAvatarUrl = avatarUrl || user.user_metadata?.avatar_url || "";
  const fullName = `${firstName} ${lastName}`.trim();

  // Only a super_admin may change a role, and only to one of the known
  // roles. Everyone else keeps whatever role they already have, regardless
  // of what the submitted form contains — the UI hides the role selector
  // for non-super-admins, but this is the actual enforcement point, since a
  // form field can be edited or submitted directly by anyone.
  const VALID_ROLES = ["manager", "director", "super_admin"];
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const currentRole = currentProfile?.role || "manager";
  const role =
    currentRole === "super_admin" && requestedRole && VALID_ROLES.includes(requestedRole)
      ? requestedRole
      : currentRole;

  // 3. Verify the OTP code sent to user's email
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: user.email,
    token: otpCode,
    type: "email",
  });

  if (verifyError) {
    return { success: false, error: "Invalid or expired verification code." };
  }

  // 4. Update Auth User Metadata
  const { error: updateAuthError } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone: phone,
      avatar_url: finalAvatarUrl,
    },
  });

  if (updateAuthError) {
    return { success: false, error: updateAuthError.message };
  }

  // 5. Upsert ALL extracted fields into 'profiles' table
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    first_name: firstName,
    last_name: lastName,
    full_name: fullName,
    role,
    avatar_url: finalAvatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 6. Purge Next.js Server Cache for the profile route
  revalidatePath("/profile", "page");
  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();

  // 1. Get the current logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Unauthorized: User not found." };
  }

  // 2. Instantiate Supabase Admin Client using Service Role Key
  const supabaseAdmin = createClientAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // 3. Delete user from auth.users (Cascades to public.profiles if configured)
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id
  );

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  // 4. Sign out the user locally to clear session cookies
  await supabase.auth.signOut();

  return { success: true };
}