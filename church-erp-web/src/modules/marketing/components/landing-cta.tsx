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
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(216,187,123,0.12),transparent_62%)]" />

      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="relative overflow-hidden rounded-[42px] border border-[#183d30] bg-[linear-gradient(135deg,#123227_0%,#0b1d17_100%)] px-6 py-12 text-white shadow-[0_36px_110px_rgba(7,15,12,0.28)] sm:px-10 sm:py-16 lg:px-14 xl:px-16">
          <div className="absolute -right-14 top-0 h-48 w-48 rounded-full bg-[#d8bb7b]/16 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-[#1f5b49]/28 blur-3xl" />
          <div className="absolute inset-x-12 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(216,187,123,0.7),transparent)]" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_420px] xl:items-end xl:gap-12 2xl:grid-cols-[minmax(0,1.1fr)_460px]">
            <div className="max-w-4xl space-y-6">
              <Badge className="w-fit border-[#d8bb7b]/20 bg-[#d8bb7b]/10 text-[#f4dfb2] shadow-[0_10px_30px_rgba(216,187,123,0.08)]">
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
                  className="bg-[linear-gradient(135deg,#dcc283_0%,#b38a49_100%)] text-[#13241d] shadow-[0_22px_60px_rgba(179,138,73,0.28)] hover:opacity-95"
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
                  className="border-white/14 bg-white/6 text-white hover:bg-white/10"
                >
                  <Link href={content.secondaryAction.href}>
                    {content.secondaryAction.label}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_22px_54px_rgba(3,9,7,0.18)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d8bb7b]">
                Contato direto
              </p>

              <div className="mt-5 flex items-start gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-[#d8bb7b]/20 bg-[#d8bb7b]/10 text-[#f4dfb2]">
                  <PhoneCall className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-white/72">WhatsApp comercial</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-[#f4dfb2] sm:text-3xl">
                    {phoneDisplay}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/70">
                {landingContent.whatsapp.description}
              </p>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/56">
                  Organização e praticidade
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Um caminho simples para conhecer como o Igreja ERP pode apoiar a
                  administração da igreja com mais clareza no dia a dia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
