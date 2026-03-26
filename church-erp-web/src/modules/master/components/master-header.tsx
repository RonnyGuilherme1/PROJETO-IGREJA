"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthUserPanel } from "@/modules/auth/components/auth-user-panel";
import { MasterThemeToggle } from "@/modules/master/components/master-theme-toggle";
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
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "America/Fortaleza",
      }).format(new Date()),
    );
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-[color:var(--surface-soft)]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-24 w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <div className="lg:hidden">{mobileNavigation}</div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground/80">
              Plataforma Church ERP
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="hidden max-w-2xl text-sm leading-6 text-muted-foreground md:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden min-w-[180px] rounded-2xl border border-border bg-[color:var(--surface-base)] px-4 py-2.5 text-right sm:block">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Hoje
            </p>
            <p className="text-sm text-foreground">
              {formattedDate || "Carregando data"}
            </p>
          </div>
          <MasterThemeToggle />
          <AuthUserPanel user={user} />
        </div>
      </div>
    </header>
  );
}
