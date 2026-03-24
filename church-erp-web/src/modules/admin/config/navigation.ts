import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  Palette,
  ShieldUser,
  Users,
  Wallet,
} from "lucide-react";
import { isAdminProfile } from "@/modules/auth/lib/auth-session";

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
    description: "Visao geral do painel",
    icon: LayoutDashboard,
  },
  {
    title: "Membros",
    href: "/membros",
    description: "Gestao de membros",
    icon: Users,
  },
  {
    title: "Igrejas",
    href: "/igrejas",
    description: "Unidades e congregacoes",
    icon: Building2,
  },
  {
    title: "Tesouraria",
    href: "/tesouraria",
    description: "Financeiro e movimentos",
    icon: Wallet,
  },
  {
    title: "Usuarios",
    href: "/usuarios",
    description: "Acesso e permissoes",
    icon: ShieldUser,
  },
  {
    title: "Configuracoes",
    href: "/banco",
    description: "Tema, logo e futuras preferencias do ambiente",
    icon: Palette,
    adminOnly: true,
  },
];

export function getAdminNavItems(profile?: string) {
  return adminNavItems.filter(
    (item) => !item.adminOnly || isAdminProfile(profile),
  );
}
