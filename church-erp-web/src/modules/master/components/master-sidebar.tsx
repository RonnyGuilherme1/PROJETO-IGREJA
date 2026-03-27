"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import type { AuthUser } from "@/modules/auth/types/auth";
import { getMasterNavItems } from "@/modules/master/config/navigation";

interface MasterSidebarProps {
  user: AuthUser;
  onNavigate?: () => void;
}

export function MasterSidebar({ user, onNavigate }: MasterSidebarProps) {
  const pathname = usePathname();
  const masterNavItems = getMasterNavItems(user);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-5 py-6">
        <Link
          href="/master/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-4"
        >
          <BrandLogo
            alt="Logo da plataforma Igreja ERP"
            className="size-20 shrink-0 rounded-[2rem] bg-white/6 ring-1 ring-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
            imageClassName="object-contain p-3"
            fallbackImageClassName="scale-[1.1]"
          />
          <div className="space-y-1">
            <p className="text-base font-semibold tracking-wide text-sidebar-foreground">
              Igreja ERP
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/55">
              Painel master
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-sidebar-foreground/45">
          Navegacao
        </p>
        <nav className="mt-4 space-y-2">
          {masterNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-[1.35rem] px-3.5 py-3 transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-2xl transition-colors",
                    isActive
                      ? "bg-sidebar-foreground/12 text-sidebar-foreground"
                      : "bg-sidebar-foreground/8 text-sidebar-foreground/80 group-hover:bg-sidebar-foreground/10",
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
                        ? "text-sidebar-foreground/72"
                        : "text-sidebar-foreground/55",
                    )}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className={cn(
                    "size-4",
                    isActive
                      ? "text-sidebar-foreground opacity-100"
                      : "text-sidebar-foreground/60",
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
