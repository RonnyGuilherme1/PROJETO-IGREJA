import type { LucideIcon } from "lucide-react";
import {
  Building2,
  LayoutDashboard,
  ShieldUser,
  Users,
  Wallet,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
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
];
