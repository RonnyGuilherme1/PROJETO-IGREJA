"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ShieldUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { masterNavItems } from "@/modules/master/config/navigation";

interface MasterSidebarProps {
  onNavigate?: () => void;
}

export function MasterSidebar({ onNavigate }: MasterSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-6 py-6">
        <Link
          href="/master/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-foreground/10 text-sidebar-foreground">
            <ShieldUser className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-wide text-sidebar-foreground">
              Plataforma Church ERP
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              Plataforma
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6">
        <p className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-sidebar-foreground/45">
          Navegacao
        </p>
        <nav className="mt-4 space-y-1.5">
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
                  "group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors",
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
