import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LandingBenefitsContent } from "@/modules/marketing/data/landing-content";

interface LandingBenefitsProps {
  content: LandingBenefitsContent;
}

export function LandingBenefits({ content }: LandingBenefitsProps) {
  const [featuredBenefit, ...otherBenefits] = content.items;
  const FeaturedBenefitIcon = featuredBenefit?.icon;

  return (
    <section id={content.id} className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_1.04fr] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_1fr] 2xl:gap-10">
          <Card className="relative overflow-hidden rounded-[36px] border-primary/18 bg-gradient-to-b from-sidebar-accent to-primary p-8 text-white shadow-[0_22px_58px_rgba(12,29,23,0.16)] sm:p-10 lg:p-11">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            <div className="relative space-y-7">
              <Badge className="w-fit border-accent/20 bg-accent/10 text-accent">
                {content.eyebrow}
              </Badge>

              <div className="space-y-4">
                <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.85rem] lg:leading-[1.08]">
                  {content.title}
                </h2>
                <p className="max-w-3xl text-base leading-8 text-white/72 sm:text-lg">
                  {content.description}
                </p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-6">
                <h3 className="text-xl font-semibold text-white">
                  {content.spotlight.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  {content.spotlight.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {content.spotlight.checklist.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-white/72">
                      <CheckCircle2 className="mt-0.5 size-5 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Resultado pratico
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    Menos esforco com processos manuais e mais fluidez para a
                    rotina.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    Ganho institucional
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    Mais organizacao, clareza e seguranca para acompanhar a
                    operacao.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {featuredBenefit ? (
              <Card className="overflow-hidden rounded-[32px] border-border bg-card p-8 shadow-[0_16px_42px_rgba(24,35,30,0.07)] md:col-span-2">
                <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-accent/18 bg-accent/10 text-accent">
                    {FeaturedBenefitIcon ? <FeaturedBenefitIcon className="size-6" /> : null}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                      Ganho imediato
                    </p>
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                      {featuredBenefit.title}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                      {featuredBenefit.description}
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            {otherBenefits.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="overflow-hidden rounded-[30px] border-border bg-card p-6 shadow-[0_14px_38px_rgba(24,35,30,0.07)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(24,35,30,0.1)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/14 bg-primary/8 text-primary">
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
