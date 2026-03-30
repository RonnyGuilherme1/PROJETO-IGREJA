import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Separator } from "@/components/ui/separator";
import {
  getWhatsappHref,
  phoneDisplay,
  type LandingFooterContent,
  type LandingNavigationItem,
} from "@/modules/marketing/data/landing-content";

interface LandingFooterProps {
  brandName: string;
  content: LandingFooterContent;
  navigation: LandingNavigationItem[];
}

const navigationLabelMap: Record<string, string> = {
  "#visao-geral": "Sobre",
  "#recursos": "Funcionalidades",
  "#beneficios": "Beneficios",
  "#contato": "Contato",
};

export function LandingFooter({
  brandName,
  content,
  navigation,
}: LandingFooterProps) {
  const whatsappHref = getWhatsappHref();
  const items = navigation.map((item) => ({
    ...item,
    label: navigationLabelMap[item.href] ?? item.label,
  }));

  return (
    <footer className="relative overflow-hidden border-t border-primary/14 bg-gradient-to-b from-sidebar to-primary text-white">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-accent/6 to-transparent" />

      <div className="relative flex w-full flex-col gap-8 px-5 py-10 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="max-w-lg space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo variant="icon" className="size-14 sm:size-16" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/90">
                  {brandName}
                </p>
                <p className="text-sm text-white/64">{content.productLabel}</p>
              </div>
            </div>

            <p className="text-sm leading-7 text-white/64">{content.description}</p>
          </div>

          <div className="grid gap-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_34px_rgba(6,17,13,0.12)] sm:grid-cols-[1fr_auto] lg:min-w-[580px] xl:min-w-[640px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/56">
                Links uteis
              </p>
              <nav className="mt-4 grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-white/68 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/login"
                  className="text-sm text-white/68 transition-colors hover:text-white"
                >
                  {content.loginLabel}
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/56">
                Acoes
              </p>

              <Button
                asChild
                className="w-full bg-primary-foreground text-sidebar shadow-none hover:bg-white"
              >
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </Button>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
              >
                {content.loginLabel}
                <ArrowRight className="size-4" />
              </Link>

              <p className="text-xs text-white/60">{phoneDisplay}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col gap-2 text-sm text-white/58 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {new Date().getFullYear()} {brandName}. {content.legalNote}
          </p>
          <p>{content.note}</p>
        </div>
      </div>
    </footer>
  );
}
