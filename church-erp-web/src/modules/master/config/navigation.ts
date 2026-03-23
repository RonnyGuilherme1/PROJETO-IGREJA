import type { LucideIcon } from "lucide-react";
import { Building2, LayoutDashboard } from "lucide-react";

export interface MasterNavItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export const masterNavItems: MasterNavItem[] = [
  {
    title: "Dashboard",
    href: "/master/dashboard",
    description: "Visao geral da plataforma",
    icon: LayoutDashboard,
  },
  {
    title: "Tenants",
    href: "/master/tenants",
    description: "Clientes e ambientes",
    icon: Building2,
  },
];
