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
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Membros",
    href: "/membros",
    icon: Users,
  },
  {
    title: "Igrejas",
    href: "/igrejas",
    icon: Building2,
  },
  {
    title: "Tesouraria",
    href: "/tesouraria",
    icon: Wallet,
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    icon: ShieldUser,
    adminOnly: true,
  },
  {
    title: "Configuracoes",
    href: "/configuracoes",
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
