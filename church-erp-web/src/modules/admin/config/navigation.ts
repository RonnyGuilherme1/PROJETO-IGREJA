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
    description: "Resumo da operacao",
    icon: LayoutDashboard,
  },
  {
    title: "Membros",
    href: "/membros",
    description: "Cadastro e acompanhamento",
    icon: Users,
  },
  {
    title: "Igrejas",
    href: "/igrejas",
    description: "Unidades e informacoes principais",
    icon: Building2,
  },
  {
    title: "Tesouraria",
    href: "/tesouraria",
    description: "Entradas, saidas e categorias",
    icon: Wallet,
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    description: "Acessos e perfis",
    icon: ShieldUser,
    adminOnly: true,
  },
  {
    title: "Configuracoes",
    href: "/configuracoes",
    description: "Marca e identidade visual do ambiente",
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
