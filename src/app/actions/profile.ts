// app/actions/profile.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData, avatarUrl?: string) {
  const supabase = await createClient();

  // 1. Authenticate session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }

  // Extract Text Form Data
  const firstName = (formData.get("firstName") as string) || "";
  const lastName = (formData.get("lastName") as string) || "";
  const phone = (formData.get("phone") as string) || "";
  const bio = (formData.get("bio") as string) || "";

  // Fallback to existing avatar_url if a new one wasn't uploaded
  const finalAvatarUrl = avatarUrl || user.user_metadata?.avatar_url || "";

  // 2. Update Supabase Auth User Metadata
  const fullName = `${firstName} ${lastName}`.trim();
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

  // 3. Upsert record in 'profiles' table
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    // full_name: fullName,
    // phone_number: phone,
    role: bio,
    avatar_url: finalAvatarUrl,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  revalidatePath("/profile");
  return { success: true };
}