// Shared role constants/types. Kept out of any "use server" action file:
// Next.js only allows a "use server" module to export async functions, and
// exporting a const array or interface from one throws at module evaluation.
export const VALID_ROLES = ["manager", "director", "super_admin"] as const;
export type Role = (typeof VALID_ROLES)[number];

export interface UserListItem {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}
