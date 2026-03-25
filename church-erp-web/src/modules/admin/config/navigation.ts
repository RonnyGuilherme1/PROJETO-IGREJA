import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  Palette,
  ShieldUser,
  Users,
  Wallet,
} from "lucide-react";
import type { AuthUser } from "@/modules/auth/types/auth";

export interface AdminNavItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Indicadores principais",
    icon: LayoutDashboard,
  },
  {
    title: "Membros",
    href: "/membros",
    description: "Cadastro de membros",
    icon: Users,
  },
  {
    title: "Igrejas",
    href: "/igrejas",
    description: "Unidades cadastradas",
    icon: Building2,
  },
  {
    title: "Tesouraria",
    href: "/tesouraria",
    description: "Fluxo financeiro",
    icon: Wallet,
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    description: "Acessos do painel",
    icon: ShieldUser,
    adminOnly: true,
  },
  {
    title: "Configuracoes",
    href: "/configuracoes",
    description: "Identidade visual",
    icon: Palette,
    adminOnly: true,
  },
];

export function getAdminNavItems(user?: AuthUser | null) {
  return adminNavItems.filter(
    (item) =>
      !item.adminOnly ||
      (user?.accessType === "TENANT" && user.role === "ADMIN"),
  );
}
