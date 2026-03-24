"use client";

import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { apiConfig } from "@/lib/env";
import { getTenantLabel } from "@/lib/tenant-branding";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Badge } from "@/components/ui/badge";
import { AuthUserPanel } from "@/modules/auth/components/auth-user-panel";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminHeaderProps {
  title: string;
  description: string;
  mobileNavigation: ReactNode;
  user: AuthUser;
}

export function AdminHeader({
  title,
  description,
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
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <div className="lg:hidden">{mobileNavigation}</div>
          <BrandLogo
            alt={tenantLabel ? `Logo do banco ${tenantLabel}` : "Logo do Church ERP"}
            logoUrl={user.tenantLogoUrl}
            icon={Building2}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-xs"
            imageClassName="h-full w-full bg-card p-2"
            iconClassName="size-5 text-primary"
          />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {tenantLabel ?? "Church ERP Web"}
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="hidden text-sm text-muted-foreground md:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {tenantLabel ? (
            <Badge variant="outline" className="bg-card/80 text-foreground">
              {tenantLabel}
            </Badge>
          ) : null}
          <Badge variant={apiConfig.isConfigured ? "secondary" : "outline"}>
            {apiConfig.isConfigured ? "API pronta" : "API pendente"}
          </Badge>
          <div className="hidden rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted-foreground sm:block">
            {formattedDate}
          </div>
          <AuthUserPanel user={user} />
        </div>
      </div>
    </header>
  );
}
