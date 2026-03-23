import type { AuthUser } from "@/modules/auth/types/auth";

export function canAccessMasterArea(user?: AuthUser | null) {
  return user?.authMode === "MASTER";
}

export function getMasterAccessLabel() {
  return "Area master";
}
