import type { AuthUser } from "@/modules/auth/types/auth";

export function canAccessMasterArea(user?: AuthUser | null) {
  return (
    user?.accessType === "PLATFORM" &&
    user.platformRole === "PLATFORM_ADMIN" &&
    user.tenantId === null
  );
}

export function getMasterAccessLabel() {
  return "Area master";
}
