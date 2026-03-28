import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LandingHeroContent } from "@/modules/marketing/data/landing-content";

interface LandingHeroProps {
  content: LandingHeroContent;
}

export function LandingHero({ content }: LandingHeroProps) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(31,91,73,0.34),transparent_28%),radial-gradient(circle_at_top,rgba(216,187,123,0.16),transparent_24%),linear-gradient(180deg,#07140f_0%,#0d221b_38%,#10271f_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(216,187,123,0.5),transparent)]" />
      <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-[#d8bb7b]/10 blur-3xl" />
      <div className="absolute -left-20 top-28 h-80 w-80 rounded-full bg-[#1f5b49]/26 blur-3xl" />
      <div className="absolute -right-24 top-24 h-96 w-96 rounded-full bg-[#0f2c22] blur-3xl" />

      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:96px_96px]" />

      <div className="grid min-h-[calc(100svh-1rem)] w-full items-center gap-14 px-5 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-36 lg:grid-cols-[minmax(0,0.92fr)_minmax(720px,1.08fr)] lg:gap-14 lg:px-10 lg:pb-28 lg:pt-40 xl:grid-cols-[minmax(0,0.84fr)_minmax(860px,1.16fr)] xl:px-16 2xl:grid-cols-[minmax(0,0.78fr)_minmax(980px,1.22fr)] 2xl:px-24">
        <div className="relative z-10 max-w-4xl space-y-9">
          <Badge className="w-fit border-[#d8bb7b]/18 bg-[#d8bb7b]/10 px-4 py-1.5 text-[#f4dfb2] shadow-[0_10px_30px_rgba(216,187,123,0.1)]">
            {content.badge}
          </Badge>

          <div className="space-y-6">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[4rem] xl:max-w-[14ch] xl:text-[4.2rem] xl:leading-[1.02] 2xl:max-w-[15ch] 2xl:text-[4.45rem]">
              {content.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-white/76 sm:text-lg">
              {content.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-[linear-gradient(135deg,#dcc283_0%,#b38a49_100%)] text-[#13241d] shadow-[0_22px_60px_rgba(179,138,73,0.28)] hover:opacity-95"
            >
              <a href={content.primaryAction.href} target="_blank" rel="noreferrer">
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

          <ul className="grid gap-3 md:grid-cols-3">
            {content.highlights.map((item) => (
              <li
                key={item}
                className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 text-sm leading-6 text-white/72 shadow-[0_18px_44px_rgba(3,9,7,0.12)] backdrop-blur-sm"
              >
                <CheckCircle2 className="mb-3 size-5 text-[#d8bb7b]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 w-full max-w-[1100px] lg:justify-self-end">
          <div className="relative">
            <div className="absolute inset-6 rounded-[44px] bg-[radial-gradient(circle_at_top_right,rgba(216,187,123,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(31,91,73,0.3),transparent_38%)] blur-2xl" />

            <Card className="relative overflow-hidden rounded-[38px] border-white/10 bg-[linear-gradient(160deg,rgba(8,21,16,0.92)_0%,rgba(14,40,31,0.92)_100%)] p-6 text-white shadow-[0_38px_110px_rgba(3,9,7,0.34)] sm:p-8 xl:p-11">
              <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(216,187,123,0.7),transparent)]" />
              <div className="absolute -right-12 top-12 h-32 w-32 rounded-full border border-[#d8bb7b]/15 bg-[#d8bb7b]/8 blur-2xl" />
              <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-[#1f5b49]/18 blur-3xl" />

              <div className="relative space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <Badge className="w-fit border-[#d8bb7b]/20 bg-[#d8bb7b]/10 text-[#f4dfb2]">
                    {content.showcase.badge}
                  </Badge>
                  <div className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/50 sm:block">
                    Visual institucional
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_320px] 2xl:grid-cols-[minmax(0,1.7fr)_340px]">
                  <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-6 shadow-[0_20px_44px_rgba(3,9,7,0.12)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                      Clareza operacional
                    </p>
                    <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-white">
                      {content.showcase.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      {content.showcase.description}
                    </p>

                    <div className="mt-6">
                      <div className="flex items-end gap-2">
                        <div className="h-16 flex-1 rounded-t-2xl bg-[linear-gradient(180deg,rgba(216,187,123,0.2),rgba(216,187,123,0.72))]" />
                        <div className="h-24 flex-1 rounded-t-2xl bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.55))]" />
                        <div className="h-20 flex-1 rounded-t-2xl bg-[linear-gradient(180deg,rgba(31,91,73,0.22),rgba(31,91,73,0.86))]" />
                        <div className="h-28 flex-1 rounded-t-2xl bg-[linear-gradient(180deg,rgba(216,187,123,0.18),rgba(216,187,123,0.88))]" />
                      </div>
                      <div className="mt-3 h-px bg-white/10" />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_40px_rgba(3,9,7,0.1)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/42">
                        Centralização
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                        1 visão
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#f4dfb2]">
                        para acompanhar a rotina da igreja com mais consistência.
                      </p>
                    </div>

                    <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_18px_40px_rgba(3,9,7,0.1)]">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl border border-[#d8bb7b]/20 bg-[#d8bb7b]/10 text-[#f4dfb2]">
                          <ShieldCheck className="size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Postura confiável</p>
                          <p className="mt-2 text-sm leading-6 text-white/68">
                            Comunicação clara, estética sóbria e presença visual premium.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {content.stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[28px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_18px_40px_rgba(3,9,7,0.1)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d8bb7b]">
                        {item.value}
                      </p>
                      <p className="mt-3 text-base font-semibold text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/64">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
