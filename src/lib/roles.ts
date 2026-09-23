import type { StaffRole } from "@/lib/session";

/** Rol etiketleri tek yerde; yeni bir rol eklendiğinde arayüz sessizce bozulmasın. */
export const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: "Sahip",
  MANAGER: "Müdür",
  WAITER: "Garson",
};

export function roleLabel(role: StaffRole | string): string {
  return ROLE_LABELS[role as StaffRole] ?? role;
}
