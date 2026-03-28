"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { TenantThemeScope } from "@/components/layout/tenant-theme-scope";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminHeader } from "@/modules/admin/components/admin-header";
import { AdminSidebar } from "@/modules/admin/components/admin-sidebar";
import {
  adminNavItems,
  flattenAdminNavItems,
  getAdminLeafNavItems,
} from "@/modules/admin/config/navigation";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminShellProps {
  children: ReactNode;
  user: AuthUser;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navigationItems = getAdminLeafNavItems(user);
  const fallbackPage = navigationItems[0] ?? flattenAdminNavItems(adminNavItems)[0]!;

  const currentPage =
    navigationItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? fallbackPage;

  return (
    <TenantThemeScope themeKey={user.tenantThemeKey}>
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <AdminSidebar user={user} />
        </aside>

        <div className="flex min-h-screen flex-col">
          <AdminHeader
            title={currentPage.title}
            description={currentPage.description}
            user={user}
            mobileNavigation={
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-card/80 lg:hidden"
                  >
                    <Menu className="size-5" />
                    <span className="sr-only">Abrir navegacao</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[272px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu de navegacao</SheetTitle>
                  </SheetHeader>
                  <AdminSidebar user={user} onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
            }
          />

          <main className="flex-1 px-4 pb-6 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </TenantThemeScope>
  );
}
