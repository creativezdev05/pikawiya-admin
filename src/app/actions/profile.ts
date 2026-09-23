"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
  console.log("avatarUrl", avatarUrl, user)
  // 2. Extract Form Data FIRST (Before verifyOtp alters active session context)
  const firstName = (formData.get("firstName") as string) || "";
  const lastName = (formData.get("lastName") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const bio = (formData.get("bio") as string) || "manager";
  const finalAvatarUrl = avatarUrl || user.user_metadata?.avatar_url || "";
  const fullName = `${firstName} ${lastName}`.trim();

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
    // phone_number: phone,
    role: bio,
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