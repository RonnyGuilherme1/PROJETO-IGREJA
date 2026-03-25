"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
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

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-3 py-2.5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2"
        >
          <BrandLogo
            alt={`Logo do ambiente ${tenantLabel}`}
            logoUrl={user?.tenantLogoUrl}
            icon={Building2}
            className="size-8 shrink-0 rounded-lg bg-white/10 ring-1 ring-white/10"
            iconClassName="size-4"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-4 text-sidebar-foreground">
              {tenantTitle}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-2 py-2.5">
        <nav className="space-y-0.5">
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
                  "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                  isActive
                    ? "bg-white/14 text-white shadow-sm ring-1 ring-white/10"
                    : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-6 items-center justify-center rounded-md transition-colors",
                    isActive
                      ? "bg-white/16 text-white"
                      : "bg-white/8 text-sidebar-foreground/80 group-hover:bg-white/10",
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-4">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
