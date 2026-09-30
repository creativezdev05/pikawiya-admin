import { createClient } from "@/utils/supabase/server";

// Shared gate for every super-admin-only server action. profiles.role is the
// authoritative role source (the same one the (admin) route middleware
// checks) — never trust a role value coming from a client-submitted form.
export async function requireSuperAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Unauthorized." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return { ok: false, error: "Only super admins can do this." };
  }

  return { ok: true };
}
