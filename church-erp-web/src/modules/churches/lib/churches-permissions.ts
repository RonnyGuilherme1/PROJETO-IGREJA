import type { AuthUser } from "@/modules/auth/types/auth";

export function canEditChurches(user?: AuthUser | null) {
  return (
    user?.accessType === "TENANT" &&
    (user.role === "ADMIN" || user.role === "SECRETARIA")
  );
}

export function getChurchesAccessLabel(user?: AuthUser | null) {
  return canEditChurches(user) ? "Edicao liberada" : "Modo consulta";
}
