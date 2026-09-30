"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { requireSuperAdmin } from "@/utils/supabase/authz";
import { revalidatePath } from "next/cache";

export interface FormTypeRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface FormEmailRow {
  id: number;
  form_type_id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  notification_email: string;
  is_active: boolean;
  updated_at: string;
}

export interface FormEmailSetting {
  formType: FormTypeRow;
  email: FormEmailRow | null;
}

// Every read/write here must go through the service-role client: form_types
// and form_emails have RLS enabled with anon/authenticated revoked, and
// form_emails holds live SMTP passwords. requireSuperAdmin() is the only gate
// keeping a non-super-admin from calling these actions directly, so it's
// enforced here server-side, not just by hiding the UI in the profile page.
export async function getFormEmailSettings(): Promise<
  { success: true; data: FormEmailSetting[] } | { success: false; error: string }
> {
  const check = await requireSuperAdmin();
  if (!check.ok) return { success: false, error: check.error };

  const admin = getAdminClient();

  const { data: formTypes, error: formTypesError } = await admin
    .from("form_types")
    .select("id, code, name, description")
    .order("name", { ascending: true });

  if (formTypesError) {
    return { success: false, error: formTypesError.message };
  }

  const { data: emails, error: emailsError } = await admin
    .from("form_emails")
    .select(
      "id, form_type_id, smtp_host, smtp_port, smtp_user, smtp_pass, notification_email, is_active, updated_at"
    )
    .eq("is_active", true);

  if (emailsError) {
    return { success: false, error: emailsError.message };
  }

  const emailsByFormType = new Map((emails ?? []).map((row) => [row.form_type_id, row]));

  const data = (formTypes ?? []).map((formType) => ({
    formType,
    email: emailsByFormType.get(formType.id) ?? null,
  }));

  return { success: true, data };
}

interface FormEmailInput {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass?: string; // blank keeps the existing password
  notification_email: string;
}

export async function updateFormEmailSetting(
  formTypeId: number,
  input: FormEmailInput
): Promise<{ success: true } | { success: false; error: string }> {
  const check = await requireSuperAdmin();
  if (!check.ok) return { success: false, error: check.error };

  if (!input.smtp_host?.trim() || !input.smtp_user?.trim() || !input.notification_email?.trim()) {
    return { success: false, error: "SMTP host, user, and notification email are required." };
  }

  const admin = getAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("form_emails")
    .select("id, smtp_pass")
    .eq("form_type_id", formTypeId)
    .eq("is_active", true)
    .maybeSingle();

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  const smtpPass = input.smtp_pass?.trim() || existing?.smtp_pass;
  if (!smtpPass) {
    return { success: false, error: "SMTP password is required." };
  }

  const payload = {
    form_type_id: formTypeId,
    smtp_host: input.smtp_host.trim(),
    smtp_port: input.smtp_port,
    smtp_user: input.smtp_user.trim(),
    smtp_pass: smtpPass,
    notification_email: input.notification_email.trim(),
    is_active: true,
  };

  const { error } = existing
    ? await admin.from("form_emails").update(payload).eq("id", existing.id)
    : await admin.from("form_emails").insert(payload);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
