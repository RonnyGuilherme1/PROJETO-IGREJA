"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
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
import { adminNavItems } from "@/modules/admin/config/navigation";
import type { AuthUser } from "@/modules/auth/types/auth";

interface AdminShellProps {
  children: React.ReactNode;
  user: AuthUser;
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const currentPage =
    adminNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? adminNavItems[0];

  return (
    <div className="min-h-screen bg-background">
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
                    className="bg-white/70 lg:hidden"
                  >
                    <Menu className="size-5" />
                    <span className="sr-only">Abrir navegacao</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[290px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu de navegacao</SheetTitle>
                  </SheetHeader>
                  <AdminSidebar user={user} onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
            }
          />

          <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
