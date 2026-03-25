"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight } from "lucide-react";
import { getTenantLabel } from "@/lib/tenant-branding";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { getAdminNavItems } from "@/modules/admin/config/navigation";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminSidebarProps {
  onNavigate?: () => void;
  user?: AuthUser;
}

export function AdminSidebar({ onNavigate, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const navigationItems = getAdminNavItems(user);
  const tenantLabel =
    getTenantLabel(user?.tenantName, user?.tenantCode) ?? "Painel da igreja";
  const tenantTitle = user?.tenantName?.trim() || "Church ERP";
  const tenantSubtitle = user?.tenantCode?.trim()
    ? `Acesso ${user.tenantCode}`
    : tenantLabel;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-6 py-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <BrandLogo
            alt={`Logo do ambiente ${tenantLabel}`}
            logoUrl={user?.tenantLogoUrl}
            icon={Building2}
            className="size-14 shrink-0 rounded-2xl bg-white/10 ring-1 ring-white/10"
            iconClassName="size-6"
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-wide text-sidebar-foreground">
              {tenantTitle}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              {tenantSubtitle}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-sidebar-foreground/45">
          Navegacao
        </p>
        <nav className="mt-4 space-y-1.5">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors",
                  isActive
                    ? "bg-white/14 text-white shadow-sm ring-1 ring-white/10"
                    : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-2xl transition-colors",
                    isActive
                      ? "bg-white/16 text-white"
                      : "bg-white/8 text-sidebar-foreground/80 group-hover:bg-white/10",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs leading-5",
                      isActive
                        ? "text-white/72"
                        : "text-sidebar-foreground/55",
                    )}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "size-4",
                    isActive ? "text-white opacity-100" : "opacity-60",
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
