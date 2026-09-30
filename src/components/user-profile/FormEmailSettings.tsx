"use client";

import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import Select from "../form/Select";
import {
  FormEmailSetting,
  updateFormEmailSetting,
} from "@/app/actions/formEmails";
import { UserListItem } from "@/lib/roles";

interface FormEmailSettingsProps {
  settings: FormEmailSetting[];
  users: UserListItem[];
}

interface EditFormState {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  notification_email: string;
}

const emptyForm: EditFormState = {
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  notification_email: "",
};

export default function FormEmailSettings({ settings, users }: FormEmailSettingsProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [active, setActive] = useState<FormEmailSetting | null>(null);
  const [form, setForm] = useState<EditFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (setting: FormEmailSetting) => {
    setActive(setting);
    setForm({
      smtp_host: setting.email?.smtp_host ?? "",
      smtp_port: String(setting.email?.smtp_port ?? 587),
      smtp_user: setting.email?.smtp_user ?? "",
      smtp_pass: "",
      notification_email: setting.email?.notification_email ?? "",
    });
    setError(null);
    openModal();
  };

  const handleSave = async () => {
    if (!active) return;
    setSaving(true);
    setError(null);

    const result = await updateFormEmailSetting(active.formType.id, {
      smtp_host: form.smtp_host,
      smtp_port: Number(form.smtp_port) || 587,
      smtp_user: form.smtp_user,
      smtp_pass: form.smtp_pass || undefined,
      notification_email: form.notification_email,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    closeModal();
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
      <h4 className="mb-4 text-lg font-semibold text-gray-800 lg:mb-6 dark:text-white/90">
        Form Email Settings
      </h4>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Each form type sends through its own SMTP account and notifies its own inbox. Only
        super admins can view or change these.
      </p>
      <div>
        {settings.map((setting) => (
          <div
            key={setting.formType.id}
            className="flex flex-col justify-between gap-4 border-b border-gray-200 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-end dark:border-gray-800"
          >
            <div>
              <span className="mb-1 block text-base font-medium text-gray-800 dark:text-white/90">
                {setting.formType.name}
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {setting.email
                  ? `Notifies ${setting.email.notification_email} via ${setting.email.smtp_user}`
                  : "Not configured — falls back to the default environment settings"}
              </p>
            </div>
            <div>
              <button
                onClick={() => handleEdit(setting)}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 pe-4 ps-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200"
              >
                {setting.email ? "Edit" : "Set up"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[600px]">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            {active?.formType.name} — Email Settings
          </h4>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>SMTP Host</Label>
              <Input
                value={form.smtp_host}
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_host: e.target.value }))}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label>SMTP Port</Label>
              <Input
                type="number"
                value={form.smtp_port}
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_port: e.target.value }))}
                placeholder="587"
              />
            </div>
            <div>
              <Label>SMTP User</Label>
              <Input
                name="smtp_user_config"
                autoComplete="off"
                value={form.smtp_user}
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_user: e.target.value }))}
                placeholder="sender@gmail.com"
              />
            </div>
            <div>
              <Label>SMTP Password</Label>
              {/* autoComplete="new-password" stops the browser from autofilling this
                  with the logged-in admin's own saved password for this site — without
                  it, a password manager can silently fill this field on modal open and
                  the admin's own login password gets saved as the SMTP password. */}
              <Input
                type="password"
                name="smtp_pass_config"
                autoComplete="new-password"
                value={form.smtp_pass}
                onChange={(e) => setForm((prev) => ({ ...prev, smtp_pass: e.target.value }))}
                placeholder={active?.email ? "Leave blank to keep current password" : ""}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Notification Email</Label>
              <Input
                type="email"
                value={form.notification_email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notification_email: e.target.value }))
                }
                placeholder="admin@pikawiyahealth.org.au"
              />
              {users.length > 0 && (
                <div className="mt-2">
                  {/* Picks from admin-panel users for convenience and pastes their email
                      into the field above — the notification inbox doesn't have to belong
                      to an admin-panel user at all, so the text field stays editable. */}
                  <Select
                    key={active?.formType.id}
                    options={users.map((u) => ({
                      value: u.email,
                      label: `${u.full_name || u.email} (${u.role})`,
                    }))}
                    placeholder="Or pick a user to paste their email..."
                    onChange={(email) =>
                      setForm((prev) => ({ ...prev, notification_email: email }))
                    }
                    className="dark:bg-dark-900"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
