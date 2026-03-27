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
  const tenantTitle = user?.tenantName?.trim() || "Igreja ERP";
  const tenantSubtitle = user?.tenantCode?.trim()
    ? `Acesso ${user.tenantCode}`
    : tenantLabel;

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
                  "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors",
                  isActive
                    ? "bg-white/14 text-white shadow-sm ring-1 ring-white/10"
                    : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-xl transition-colors",
                    isActive
                      ? "bg-white/16 text-white"
                      : "bg-white/8 text-sidebar-foreground/80 group-hover:bg-white/10",
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-5">
                    {item.title}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "size-3.5 shrink-0",
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
