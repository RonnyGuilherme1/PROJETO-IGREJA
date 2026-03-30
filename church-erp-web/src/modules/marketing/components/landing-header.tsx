"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  LandingAction,
  LandingNavigationItem,
} from "@/modules/marketing/data/landing-content";

interface LandingHeaderProps {
  brandName: string;
  brandLabel: string;
  navigation: LandingNavigationItem[];
  loginAction: LandingAction;
}

const navigationLabelMap: Record<string, string> = {
  "#visao-geral": "Sobre",
  "#recursos": "Funcionalidades",
  "#beneficios": "Beneficios",
  "#contato": "Contato",
};

const fallbackNavigation: LandingNavigationItem[] = [
  { label: "Sobre", href: "#visao-geral" },
  { label: "Funcionalidades", href: "#recursos" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Contato", href: "#contato" },
];

export function LandingHeader({
  brandName,
  brandLabel,
  navigation,
  loginAction,
}: LandingHeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const items = useMemo(() => {
    const source = navigation.length > 0 ? navigation : fallbackNavigation;

    return source.map((item) => ({
      ...item,
      label: navigationLabelMap[item.href] ?? item.label,
    }));
  }, [navigation]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "w-full transition-all duration-300",
          hasScrolled
            ? "border-b border-border/60 bg-background/94 shadow-[0_12px_28px_rgba(24,35,30,0.06)] backdrop-blur-xl"
            : "border-b border-transparent bg-sidebar/72 shadow-none backdrop-blur-lg",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <Link href="/" className="flex items-center gap-3.5">
            <BrandLogo variant="icon" className="size-14 sm:size-16" />
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-sm font-semibold uppercase tracking-[0.18em]",
                  hasScrolled ? "text-foreground" : "text-white",
                )}
              >
                {brandName}
              </p>
              <p
                className={cn(
                  "hidden text-xs sm:block",
                  hasScrolled ? "text-muted-foreground" : "text-white/60",
                )}
              >
                {brandLabel}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex xl:gap-10">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  hasScrolled
                    ? "text-foreground/72 hover:text-foreground"
                    : "text-white/72 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={cn(
                "hidden lg:inline-flex",
                hasScrolled
                  ? "border-border bg-card/92 text-foreground shadow-none hover:bg-secondary/78"
                  : "border-white/12 bg-white/[0.04] text-white shadow-none hover:bg-white/[0.08]",
              )}
            >
              <Link href={loginAction.href}>Entrar</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "lg:hidden",
                    hasScrolled
                      ? "border-border bg-card/92 text-foreground shadow-none hover:bg-secondary/78"
                      : "border-white/12 bg-white/[0.04] text-white shadow-none hover:bg-white/[0.08]",
                  )}
                  aria-label="Abrir menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[88vw] border-border bg-background text-foreground shadow-[0_18px_44px_rgba(24,35,30,0.1)] sm:max-w-sm"
              >
                <SheetHeader className="border-b border-border/70 pb-5 pr-8">
                  <SheetTitle className="text-foreground">{brandName}</SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    Navegacao rapida para conhecer a plataforma e acessar o
                    sistema.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-3">
                  {items.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <a
                        href={item.href}
                        className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/80 hover:text-foreground"
                      >
                        {item.label}
                      </a>
                    </SheetClose>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Acesso
                  </p>
                  <SheetClose asChild>
                    <Link
                      href={loginAction.href}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "w-full bg-primary text-primary-foreground shadow-[0_12px_24px_rgba(20,53,43,0.1)] hover:bg-primary/92",
                      )}
                    >
                      Entrar
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
