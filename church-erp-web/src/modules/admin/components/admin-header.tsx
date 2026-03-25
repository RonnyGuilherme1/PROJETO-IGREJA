"use client";

import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { getTenantLabel } from "@/lib/tenant-branding";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AuthUserPanel } from "@/modules/auth/components/auth-user-panel";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminHeaderProps {
  title: string;
  mobileNavigation: ReactNode;
  user: AuthUser;
}

export function AdminHeader({
  title,
  mobileNavigation,
  user,
}: AdminHeaderProps) {
  const tenantLabel = getTenantLabel(user.tenantName, user.tenantCode);
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-12 w-full max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <div className="lg:hidden">{mobileNavigation}</div>
          <BrandLogo
            alt={tenantLabel ? `Logo do ambiente ${tenantLabel}` : "Logo do Church ERP"}
            logoUrl={user.tenantLogoUrl}
            icon={Building2}
            className="size-8 shrink-0 rounded-lg border border-border bg-card shadow-xs"
            iconClassName="size-4 text-primary"
          />
          <div className="min-w-0 flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {title}
            </h2>
            <span className="hidden size-1 rounded-full bg-border md:block" />
            <p className="hidden truncate text-xs text-muted-foreground md:block">
              {tenantLabel ?? "Church ERP Web"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden rounded-full border border-border bg-card/80 px-2 py-0.5 text-[10px] text-muted-foreground sm:block">
            {formattedDate}
          </div>
          <AuthUserPanel user={user} />
        </div>
      </div>
    </header>
  );
}
