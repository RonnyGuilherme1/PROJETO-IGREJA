import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LandingAboutContent } from "@/modules/marketing/data/landing-content";

interface LandingAboutProps {
  content: LandingAboutContent;
}

const summaryPoints = [
  "Organizacao administrativa",
  "Clareza para acompanhar a operacao",
  "Praticidade para o dia a dia",
] as const;

export function LandingAbout({ content }: LandingAboutProps) {
  const [featuredPillar, ...supportingPillars] = content.pillars;
  const FeaturedPillarIcon = featuredPillar?.icon;

  return (
    <section id={content.id} className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent/8 to-transparent" />

      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:gap-14 2xl:grid-cols-[minmax(0,1.12fr)_minmax(520px,0.88fr)]">
          <div className="space-y-7">
            <Badge className="w-fit border-accent/20 bg-accent/10 text-accent">
              {content.eyebrow}
            </Badge>

            <div className="space-y-5">
              <h2 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.85rem] lg:leading-[1.08]">
                {content.title}
              </h2>
              <p className="max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg">
                {content.description}
              </p>
              <p className="max-w-4xl text-base leading-8 text-muted-foreground">
                {content.secondaryDescription}
              </p>
            </div>

            <Card className="overflow-hidden rounded-[34px] border-border bg-card p-8 shadow-[0_16px_40px_rgba(24,35,30,0.07)] sm:p-9">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                    O que e o Igreja ERP
                  </p>
                  <p className="text-lg leading-8 text-foreground sm:text-xl">
                    Uma solucao pensada para dar mais ordem a administracao da
                    igreja, reunir informacoes importantes em um so ambiente e
                    tornar a rotina mais clara para quem acompanha a operacao.
                  </p>
                </div>

                <div className="grid gap-3">
                  {summaryPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-[22px] border border-border bg-secondary/55 px-4 py-3.5 text-sm font-medium text-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {featuredPillar ? (
              <Card className="relative overflow-hidden rounded-[36px] border-primary/18 bg-gradient-to-b from-sidebar-accent to-primary p-8 text-white shadow-[0_22px_56px_rgba(12,29,23,0.16)] sm:p-9 md:col-span-2">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl space-y-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-accent/18 bg-accent/10 text-accent">
                      {FeaturedPillarIcon ? <FeaturedPillarIcon className="size-6" /> : null}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold tracking-tight">
                        {featuredPillar.title}
                      </h3>
                      <p className="text-sm leading-7 text-white/70">
                        {featuredPillar.description}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
                    <div className="space-y-3">
                      {summaryPoints.map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm text-white/72">
                          <CheckCircle2 className="mt-0.5 size-4 text-accent" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {supportingPillars.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="overflow-hidden rounded-[30px] border-border bg-card p-6 shadow-[0_14px_36px_rgba(24,35,30,0.07)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(24,35,30,0.1)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-accent/18 bg-accent/10 text-accent">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
