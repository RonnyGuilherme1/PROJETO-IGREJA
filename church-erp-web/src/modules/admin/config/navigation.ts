import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FolderKanban,
  FolderTree,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Palette,
  ShieldUser,
  Users,
  Wallet,
} from "lucide-react";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminNavBaseItem {
  title: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export interface AdminNavLeafItem extends AdminNavBaseItem {
  href: string;
  children?: never;
}

export interface AdminNavGroupItem extends AdminNavBaseItem {
  children: AdminNavItem[];
  href?: never;
}

export type AdminNavItem = AdminNavLeafItem | AdminNavGroupItem;

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Indicadores principais",
    icon: LayoutDashboard,
  },
  {
    title: "Cadastros",
    description: "Cadastros principais do painel",
    icon: FolderTree,
    children: [
      {
        title: "Igrejas",
        href: "/igrejas",
        description: "Unidades cadastradas",
        icon: Building2,
      },
      {
        title: "Membros",
        href: "/membros",
        description: "Cadastro de membros",
        icon: Users,
      },
      {
        title: "Cargos de lideranca",
        href: "/cargos-lideranca",
        description: "Funcoes de lideranca",
        icon: ShieldUser,
      },
      {
        title: "Departamentos",
        href: "/departamentos",
        description: "Areas e departamentos",
        icon: FolderKanban,
      },
    ],
  },
  {
    title: "Financeiro",
    description: "Operacoes financeiras",
    icon: Wallet,
    children: [
      {
        title: "Lancamentos",
        href: "/tesouraria",
        description: "Fluxo financeiro",
        icon: Wallet,
      },
      {
        title: "Campanhas",
        href: "/campanhas",
        description: "Campanhas parceladas",
        icon: FolderKanban,
      },
    ],
  },
  {
    title: "Avisos",
    href: "/avisos",
    description: "Comunicados e avisos",
    icon: Megaphone,
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
    description: "Identidade visual e integracoes",
    icon: Palette,
    adminOnly: true,
    children: [
      {
        title: "Identidade visual",
        href: "/configuracoes",
        description: "Logo e tema do ambiente",
        icon: Palette,
      },
      {
        title: "WhatsApp oficial",
        href: "/configuracoes/whatsapp",
        description: "Credenciais e destinos",
        icon: MessageCircle,
      },
    ],
  },
];

function hasAdminAccess(user?: AuthUser | null) {
  return user?.accessType === "TENANT" && user.role === "ADMIN";
}

export function isAdminNavGroup(item: AdminNavItem): item is AdminNavGroupItem {
  return "children" in item;
}

function canAccessAdminNavItem(item: AdminNavItem, user?: AuthUser | null) {
  return !item.adminOnly || hasAdminAccess(user);
}

export function flattenAdminNavItems(items: AdminNavItem[]): AdminNavLeafItem[] {
  return items.flatMap((item) =>
    isAdminNavGroup(item) ? flattenAdminNavItems(item.children) : [item],
  );
}

export function getAdminNavItems(user?: AuthUser | null): AdminNavItem[] {
  return adminNavItems.reduce<AdminNavItem[]>((items, item) => {
    if (!canAccessAdminNavItem(item, user)) {
      return items;
    }

    if (!isAdminNavGroup(item)) {
      items.push(item);
      return items;
    }

    const children = item.children.filter((child) =>
      canAccessAdminNavItem(child, user),
    );

    if (children.length === 0) {
      return items;
    }

    items.push({
      ...item,
      children,
    });

    return items;
  }, []);
}

export function getAdminLeafNavItems(
  user?: AuthUser | null,
): AdminNavLeafItem[] {
  return flattenAdminNavItems(getAdminNavItems(user));
}

export function matchesAdminNavPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getBestMatchingAdminLeafItem(
  pathname: string,
  user?: AuthUser | null,
): AdminNavLeafItem | undefined {
  return getAdminLeafNavItems(user).reduce<AdminNavLeafItem | undefined>(
    (bestMatch, item) => {
      if (!matchesAdminNavPath(pathname, item.href)) {
        return bestMatch;
      }

      if (!bestMatch || item.href.length > bestMatch.href.length) {
        return item;
      }

      return bestMatch;
    },
    undefined,
  );
}
