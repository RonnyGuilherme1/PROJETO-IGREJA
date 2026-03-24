"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight } from "lucide-react";
import { apiConfig } from "@/lib/env";
import { getTenantLabel } from "@/lib/tenant-branding";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { getAdminNavItems } from "@/modules/admin/config/navigation";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminSidebarProps {
  onNavigate?: () => void;
  user?: AuthUser;
}

export function AdminSidebar({ onNavigate, user }: AdminSidebarProps) {
  const pathname = usePathname();
  const navigationItems = getAdminNavItems(user?.profile);
  const tenantLabel =
    getTenantLabel(user?.tenantName, user?.tenantCode) ?? "Painel administrativo";
  const tenantTitle = user?.tenantName?.trim() || "Church ERP";
  const tenantSubtitle = user?.tenantCode?.trim()
    ? `Banco ${user.tenantCode}`
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
            alt={`Logo do banco ${tenantLabel}`}
            logoUrl={user?.tenantLogoUrl}
            icon={Building2}
            className="flex size-14 items-center justify-center rounded-[1.35rem] bg-white/10 ring-1 ring-white/10"
            imageClassName="bg-card p-1.5"
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
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors",
                  isActive
                    ? "bg-white text-sidebar shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-2xl transition-colors",
                    isActive
                      ? "bg-secondary text-primary"
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
                        ? "text-foreground/60"
                        : "text-sidebar-foreground/55",
                    )}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="size-4 opacity-60" />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="rounded-3xl bg-white/8 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">
                API REST
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                Configuracao do frontend
              </p>
            </div>
            <Badge
              variant={apiConfig.isConfigured ? "secondary" : "outline"}
              className={cn(
                "border-white/10",
                apiConfig.isConfigured
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-transparent text-sidebar-foreground",
              )}
            >
              {apiConfig.isConfigured ? "OK" : "Pendente"}
            </Badge>
          </div>

          <p className="mt-3 break-all font-mono text-xs leading-6 text-sidebar-foreground/70">
            {apiConfig.baseUrl}
          </p>
        </div>
      </div>
    </div>
  );
}
