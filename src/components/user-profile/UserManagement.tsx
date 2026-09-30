"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import Select from "../form/Select";
import Badge from "../ui/badge/Badge";
import { updateUserProfile } from "@/app/actions/users";
import { UserListItem } from "@/lib/roles";

interface UserManagementProps {
  users: UserListItem[];
}

const ROLE_OPTIONS = [
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "super_admin", label: "Super Admin" },
];

function roleBadgeColor(role: string): "error" | "warning" | "primary" {
  switch (role) {
    case "super_admin":
      return "error";
    case "director":
      return "warning";
    default:
      return "primary";
  }
}

export default function UserManagement({ users: initialUsers }: UserManagementProps) {
  const router = useRouter();
  const { isOpen, openModal, closeModal } = useModal();
  const [users, setUsers] = useState(initialUsers);
  const [active, setActive] = useState<UserListItem | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("manager");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (user: UserListItem) => {
    setActive(user);
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setRole(user.role);
    setError(null);
    openModal();
  };

  const handleSave = async () => {
    if (!active) return;
    setSaving(true);
    setError(null);

    const result = await updateUserProfile(active.id, {
      first_name: firstName,
      last_name: lastName,
      role,
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === active.id
          ? {
              ...u,
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim(),
              role: role as UserListItem["role"],
            }
          : u
      )
    );
    closeModal();
    router.refresh();
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/3">
      <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
        User Management
      </h4>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
        Update any user&apos;s name or role. Email and phone can&apos;t be changed here.
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/5">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-white/5">
              <tr>
                <th className="p-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Name
                </th>
                <th className="p-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Email
                </th>
                <th className="p-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th className="p-3 text-theme-xs font-medium text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="p-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {user.full_name || "—"}
                  </td>
                  <td className="p-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="p-3 text-theme-sm">
                    <Badge size="sm" color={roleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-theme-sm font-medium text-brand-500 hover:underline dark:text-brand-400"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="m-4 max-w-[500px]">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-6 lg:p-8 dark:bg-gray-900">
          <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit User
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{active?.email}</p>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Role</Label>
              <Select
                options={ROLE_OPTIONS}
                onChange={setRole}
                defaultValue={role}
                className="dark:bg-dark-900"
              />
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
