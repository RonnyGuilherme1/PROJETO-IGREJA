import type { AuthUser } from "@/modules/auth/types/auth";

export function canEditTreasury(user?: AuthUser | null) {
  return (
    user?.accessType === "TENANT" &&
    (user.role === "ADMIN" || user.role === "TESOUREIRO")
  );
}

export function getTreasuryAccessLabel(user?: AuthUser | null) {
  return canEditTreasury(user) ? "Gerenciamento" : "Consulta";
}
