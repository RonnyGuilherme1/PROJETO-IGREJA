import type { AuthUser } from "@/modules/auth/types/auth";

export function canAccessMasterArea(user?: AuthUser | null) {
  return (
    user?.accessType === "PLATFORM" &&
    (user.platformRole === "PLATFORM_ADMIN" ||
      user.platformRole === "PLATFORM_OPERATOR") &&
    user.tenantId === null
  );
}

export function canManagePlatformUsers(user?: AuthUser | null) {
  return canAccessMasterArea(user) && user?.platformRole === "PLATFORM_ADMIN";
}

export function getMasterAccessLabel(user?: AuthUser | null) {
  if (user?.platformRole === "PLATFORM_ADMIN") {
    return "Administrador da plataforma";
  }

  if (user?.platformRole === "PLATFORM_OPERATOR") {
    return "Operador da plataforma";
  }

  return "Plataforma";
}
