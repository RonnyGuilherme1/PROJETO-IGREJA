import type { LucideIcon } from "lucide-react";
import { Building2, LayoutDashboard, Users } from "lucide-react";
import type { AuthUser } from "@/modules/auth/types/auth";
import { canManagePlatformUsers } from "@/modules/master/lib/master-access";

export interface MasterNavItem {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

const baseMasterNavItems: MasterNavItem[] = [
  {
    title: "Dashboard",
    href: "/master/dashboard",
    description: "Resumo da plataforma",
    icon: LayoutDashboard,
  },
  {
    title: "Ambientes",
    href: "/master/tenants",
    description: "Clientes e acessos",
    icon: Building2,
  },
  {
    title: "Usuarios master",
    href: "/master/usuarios",
    description: "Equipe da plataforma",
    icon: Users,
  },
];

export function getMasterNavItems(user?: AuthUser | null) {
  if (canManagePlatformUsers(user)) {
    return baseMasterNavItems;
  }

  return baseMasterNavItems.filter((item) => item.href !== "/master/usuarios");
}
