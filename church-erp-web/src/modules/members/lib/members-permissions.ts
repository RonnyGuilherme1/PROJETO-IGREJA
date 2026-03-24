import type { AuthUser } from "@/modules/auth/types/auth";

export function canEditMembers(user?: AuthUser | null) {
  return (
    user?.accessType === "TENANT" &&
    (user.role === "ADMIN" || user.role === "SECRETARIA")
  );
}

export function getMembersAccessLabel(user?: AuthUser | null) {
  return canEditMembers(user) ? "Edicao liberada" : "Modo consulta";
}
