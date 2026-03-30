import Link from "next/link";
import { ArrowRight, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getWhatsappHref,
  landingContent,
  phoneDisplay,
  type LandingCtaContent,
} from "@/modules/marketing/data/landing-content";

interface LandingCtaProps {
  content: LandingCtaContent;
}

export function LandingCta({ content }: LandingCtaProps) {
  const whatsappHref = getWhatsappHref();

  return (
    <section id={content.id} className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="relative overflow-hidden rounded-[38px] border border-primary/16 bg-gradient-to-b from-sidebar-accent to-primary px-6 py-12 text-white shadow-[0_24px_60px_rgba(12,29,23,0.16)] sm:px-10 sm:py-16 lg:px-14 xl:px-16">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/55 to-transparent" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_420px] xl:items-end xl:gap-12 2xl:grid-cols-[minmax(0,1.1fr)_460px]">
            <div className="max-w-4xl space-y-6">
              <Badge className="w-fit border-accent/20 bg-accent/10 text-accent">
                {content.badge}
              </Badge>

              <div className="space-y-4">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.95rem] lg:leading-[1.06]">
                  {content.title}
                </h2>
                <p className="max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                  {content.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary-foreground text-primary shadow-[0_12px_28px_rgba(12,29,23,0.12)] hover:bg-white"
                >
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    {content.primaryAction.label}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/14 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                >
                  <Link href={content.secondaryAction.href}>
                    {content.secondaryAction.label}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                Contato direto
              </p>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                  <PhoneCall className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-white/72">WhatsApp comercial</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {phoneDisplay}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/70">
                {landingContent.whatsapp.description}
              </p>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                  Organizacao e praticidade
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Um caminho simples para conhecer como o Igreja ERP pode apoiar a
                  administracao da igreja com mais clareza no dia a dia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
