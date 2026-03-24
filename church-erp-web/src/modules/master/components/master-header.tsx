"use client";

import type { ReactNode } from "react";
import { AuthUserPanel } from "@/modules/auth/components/auth-user-panel";
import type { AuthUser } from "@/modules/auth/types/auth";

interface MasterHeaderProps {
  title: string;
  description: string;
  mobileNavigation: ReactNode;
  user: AuthUser;
}

export function MasterHeader({
  title,
  description,
  mobileNavigation,
  user,
}: MasterHeaderProps) {
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
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Plataforma Church ERP</p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="hidden text-sm text-muted-foreground md:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-border bg-white px-4 py-2 text-sm text-muted-foreground sm:block">
            {formattedDate}
          </div>
          <AuthUserPanel user={user} />
        </div>
      </div>
    </header>
  );
}
