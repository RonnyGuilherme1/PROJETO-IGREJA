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
import { MasterHeader } from "@/modules/master/components/master-header";
import { MasterSidebar } from "@/modules/master/components/master-sidebar";
import { MasterThemeScope } from "@/modules/master/components/master-theme-scope";
import type { AuthUser } from "@/modules/auth/types/auth";
import { getMasterNavItems } from "@/modules/master/config/navigation";

interface MasterShellProps {
  children: React.ReactNode;
  user: AuthUser;
}

export function MasterShell({ children, user }: MasterShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const masterNavItems = getMasterNavItems(user);

  const currentPage =
    masterNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? masterNavItems[0];

  return (
    <MasterThemeScope>
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <MasterSidebar user={user} />
        </aside>

        <div className="flex min-h-screen flex-col">
          <MasterHeader
            title={currentPage.title}
            description={currentPage.description}
            user={user}
            mobileNavigation={
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-[color:var(--surface-base)] lg:hidden"
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
                    <SheetTitle>Menu de navegacao master</SheetTitle>
                  </SheetHeader>
                  <MasterSidebar user={user} onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
            }
          />

          <main className="flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </MasterThemeScope>
  );
}
