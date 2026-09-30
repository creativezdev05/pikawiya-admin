"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { requireSuperAdmin } from "@/utils/supabase/authz";
import { revalidatePath } from "next/cache";
import { VALID_ROLES, Role, UserListItem } from "@/lib/roles";

// Lists every user for the super-admin user-management table, and for the
// "quick-fill from a user" picker on the form email settings. Goes through
// the service-role client because a normal session can only read its own
// profiles row under RLS.
export async function listUsers(): Promise<
  { success: true; data: UserListItem[] } | { success: false; error: string }
> {
  const check = await requireSuperAdmin();
  if (!check.ok) return { success: false, error: check.error };

  const admin = getAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, email, first_name, last_name, full_name, role, avatar_url, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data ?? []) as UserListItem[] };
}

interface UpdateUserInput {
  first_name: string;
  last_name: string;
  role: string;
}

// Deliberately does not accept email — that's tied to Supabase Auth and
// changing it here would desync auth.users from profiles. There is no phone
// column on profiles to accidentally touch either.
export async function updateUserProfile(
  userId: string,
  input: UpdateUserInput
): Promise<{ success: true } | { success: false; error: string }> {
  const check = await requireSuperAdmin();
  if (!check.ok) return { success: false, error: check.error };

  if (!VALID_ROLES.includes(input.role as Role)) {
    return { success: false, error: "Invalid role." };
  }

  const firstName = input.first_name.trim();
  const lastName = input.last_name.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  const admin = getAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      role: input.role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
