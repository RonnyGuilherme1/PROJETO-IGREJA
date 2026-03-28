"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building2, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  "#beneficios": "Benefícios",
  "#contato": "Contato",
};

const fallbackNavigation: LandingNavigationItem[] = [
  { label: "Sobre", href: "#visao-geral" },
  { label: "Funcionalidades", href: "#recursos" },
  { label: "Benefícios", href: "#beneficios" },
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
          "w-full border-b transition-all duration-300",
          hasScrolled
            ? "border-white/10 bg-[#081510]/78 shadow-[0_24px_60px_rgba(3,9,7,0.24)] backdrop-blur-2xl"
            : "border-transparent bg-[linear-gradient(180deg,rgba(8,21,16,0.5)_0%,rgba(8,21,16,0.12)_100%)] backdrop-blur-md",
        )}
      >
        <div className="flex w-full items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-[#d8bb7b]/25 bg-[#123227]/92 text-[#d8bb7b] shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
              <Building2 className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-white">
                {brandName}
              </p>
              <p className="hidden text-xs text-white/58 sm:block">{brandLabel}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-9 xl:gap-10 lg:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-white/68 transition-colors hover:text-[#f4dfb2]"
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
              className="hidden border-white/12 bg-white/6 text-white shadow-[0_12px_30px_rgba(3,9,7,0.12)] hover:bg-white/10 lg:inline-flex"
            >
              <Link href={loginAction.href}>Entrar</Link>
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/12 bg-white/6 text-white shadow-[0_12px_30px_rgba(3,9,7,0.12)] hover:bg-white/10 lg:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-[88vw] border-white/10 bg-[linear-gradient(180deg,#0d2019_0%,#081510_100%)] text-white shadow-[0_30px_90px_rgba(3,9,7,0.34)] sm:max-w-sm"
              >
                <SheetHeader className="border-b border-white/10 pb-5 pr-8">
                  <SheetTitle className="text-white">{brandName}</SheetTitle>
                  <SheetDescription className="text-white/60">
                    Navegação rápida para conhecer a plataforma e acessar o sistema.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-3">
                  {items.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <a
                        href={item.href}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        {item.label}
                      </a>
                    </SheetClose>
                  ))}
                </div>

                <div className="mt-8 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                    Acesso
                  </p>
                  <SheetClose asChild>
                    <Link
                      href={loginAction.href}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "w-full bg-[linear-gradient(135deg,#dcc283_0%,#b38a49_100%)] text-[#13241d] hover:opacity-95",
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
