"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Building2, ChevronRight } from "lucide-react";
import { getTenantLabel } from "@/lib/tenant-branding";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  getBestMatchingAdminLeafItem,
  getAdminNavItems,
  isAdminNavGroup,
  type AdminNavGroupItem,
  type AdminNavItem,
  type AdminNavLeafItem,
} from "@/modules/admin/config/navigation";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminSidebarProps {
  onNavigate?: () => void;
  user?: AuthUser;
}

export function AdminSidebar({ onNavigate, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const navigationItems = getAdminNavItems(user);
  const activeLeaf = getBestMatchingAdminLeafItem(pathname, user);
  const tenantLabel =
    getTenantLabel(user?.tenantName, user?.tenantCode) ?? "Painel da igreja";
  const tenantTitle = user?.tenantName?.trim() || "Igreja ERP";
  const tenantSubtitle = user?.tenantCode?.trim()
    ? `Acesso ${user.tenantCode}`
    : tenantLabel;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function isLeafActive(item: AdminNavLeafItem) {
    return activeLeaf?.href === item.href;
  }

  function hasActiveLeaf(item: AdminNavItem): boolean {
    return isAdminNavGroup(item)
      ? item.children.some((child) => hasActiveLeaf(child))
      : isLeafActive(item);
  }

  function toggleGroup(item: AdminNavGroupItem) {
    setOpenGroups((current) => ({
      ...current,
      [item.title]: !(hasActiveLeaf(item) || Boolean(current[item.title])),
    }));
  }

  function renderLeaf(item: AdminNavLeafItem, depth = 0) {
    const isActive = isLeafActive(item);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
          depth > 0 && "ml-3 pl-3",
          isActive
            ? "bg-white/14 text-white shadow-sm ring-1 ring-white/10"
            : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center transition-colors",
            depth > 0 ? "size-7 rounded-lg" : "size-8 rounded-xl",
            isActive
              ? "bg-white/16 text-white"
              : "bg-white/8 text-sidebar-foreground/80 group-hover:bg-white/10",
          )}
        >
          <Icon className={depth > 0 ? "size-3.5" : "size-4"} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium leading-5",
              depth > 0 ? "text-[13px]" : "text-sm",
            )}
          >
            {item.title}
          </p>
        </div>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0",
            isActive ? "text-white opacity-100" : "opacity-50",
          )}
        />
      </Link>
    );
  }

  function renderNavigationItem(item: AdminNavItem, depth = 0): ReactNode {
    if (!isAdminNavGroup(item)) {
      return renderLeaf(item, depth);
    }

    const groupIsActive = hasActiveLeaf(item);
    const isExpanded = groupIsActive || Boolean(openGroups[item.title]);
    const Icon = item.icon;

    return (
      <div key={item.title} className="space-y-1">
        <button
          type="button"
          onClick={() => toggleGroup(item)}
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
            groupIsActive || isExpanded
              ? "bg-white/12 text-white ring-1 ring-white/10"
              : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
          )}
        >
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-xl transition-colors",
              groupIsActive || isExpanded
                ? "bg-white/16 text-white"
                : "bg-white/8 text-sidebar-foreground/80 group-hover:bg-white/10",
            )}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-5">{item.title}</p>
          </div>
          <ChevronRight
            className={cn(
              "size-4 shrink-0 transition-transform",
              isExpanded ? "rotate-90 text-white" : "opacity-60",
            )}
          />
        </button>

        {isExpanded ? (
          <div className="ml-4 border-l border-white/10 pl-2">
            {item.children.map((child) => renderNavigationItem(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-4 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3.5"
        >
          <BrandLogo
            alt={`Logo do ambiente ${tenantLabel}`}
            logoUrl={user?.tenantLogoUrl}
            icon={Building2}
            className="size-14 shrink-0 rounded-2xl bg-white/12 ring-1 ring-white/12 shadow-[0_10px_24px_rgba(0,0,0,0.14)]"
            imageClassName="object-contain p-2"
            fallbackImageClassName="scale-[1.08]"
            iconClassName="size-6"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-[0.95rem] font-semibold leading-5 tracking-wide text-sidebar-foreground">
              {tenantTitle}
            </p>
            <p className="truncate text-[11px] leading-4 text-sidebar-foreground/60">
              {tenantSubtitle}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => renderNavigationItem(item))}
        </nav>
      </div>
    </div>
  );
}
