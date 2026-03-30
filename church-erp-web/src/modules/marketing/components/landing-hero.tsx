import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--marketing-hero-start)_0%,var(--marketing-hero-end)_62%,var(--background)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,var(--marketing-glow-soft),transparent_46%)]" />
      <div className="absolute right-0 top-24 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />

      <div className="grid min-h-[calc(100svh-1rem)] w-full items-center gap-12 px-5 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-36 lg:grid-cols-[minmax(0,0.92fr)_minmax(720px,1.08fr)] lg:gap-12 lg:px-10 lg:pb-24 lg:pt-40 xl:grid-cols-[minmax(0,0.84fr)_minmax(860px,1.16fr)] xl:px-16 2xl:grid-cols-[minmax(0,0.78fr)_minmax(980px,1.22fr)] 2xl:px-24">
        <div className="relative z-10 max-w-4xl space-y-7">
          <Badge className="w-fit border-accent/18 bg-accent/10 px-4 py-1.5 text-accent">
            {content.badge}
          </Badge>

          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[4rem] xl:max-w-[14ch] xl:text-[4.2rem] xl:leading-[1.02] 2xl:max-w-[15ch] 2xl:text-[4.45rem]">
              {content.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-white/74 sm:text-lg">
              {content.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground shadow-[0_14px_30px_rgba(12,29,23,0.14)] hover:bg-primary/92"
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
              className="border-[var(--marketing-dark-border)] bg-[var(--marketing-dark-surface-soft)] text-white hover:bg-white/[0.07]"
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
                className="rounded-[26px] border border-[var(--marketing-dark-border)] bg-[var(--marketing-dark-surface-soft)] p-5 text-sm leading-6 text-white/72 shadow-[0_10px_24px_rgba(6,17,13,0.1)]"
              >
                <CheckCircle2 className="mb-3 size-5 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 w-full max-w-[1100px] lg:justify-self-end">
          <Card className="relative overflow-hidden rounded-[34px] border-border/80 bg-[var(--marketing-panel-soft)] p-6 text-card-foreground shadow-[0_22px_54px_rgba(24,35,30,0.11)] sm:p-8 xl:p-10">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/55 to-transparent" />

            <div className="relative space-y-6">
              <div className="flex items-center justify-between gap-4">
                <Badge className="w-fit border-accent/20 bg-accent/10 text-accent">
                  {content.showcase.badge}
                </Badge>
                <div className="hidden rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:block">
                  ERP institucional
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.48fr)_300px] 2xl:grid-cols-[minmax(0,1.58fr)_320px]">
                <div className="rounded-[28px] border border-border bg-[var(--marketing-panel-muted)] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                    Clareza operacional
                  </p>
                  <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight text-foreground">
                    {content.showcase.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {content.showcase.description}
                  </p>

                  <div className="mt-6">
                    <div className="flex items-end gap-2">
                      <div className="h-16 flex-1 rounded-t-2xl bg-primary/14" />
                      <div className="h-24 flex-1 rounded-t-2xl bg-border/90" />
                      <div className="h-20 flex-1 rounded-t-2xl bg-primary/42" />
                      <div className="h-28 flex-1 rounded-t-2xl bg-accent/38" />
                    </div>
                    <div className="mt-3 h-px bg-border" />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[28px] border border-border bg-card p-5 shadow-[0_10px_22px_rgba(24,35,30,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                      Centralizacao
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                      1 visao
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      para acompanhar a rotina da igreja com mais consistencia.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-border bg-card p-5 shadow-[0_10px_22px_rgba(24,35,30,0.05)]">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Postura confiavel
                        </p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Comunicacao clara, estetica sobria e presenca visual
                          premium.
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
                    className="rounded-[24px] border border-border bg-card p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                      {item.value}
                    </p>
                    <p className="mt-3 text-base font-semibold text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
