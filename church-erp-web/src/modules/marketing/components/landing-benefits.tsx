import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LandingBenefitsContent } from "@/modules/marketing/data/landing-content";

interface LandingBenefitsProps {
  content: LandingBenefitsContent;
}

export function LandingBenefits({ content }: LandingBenefitsProps) {
  const [featuredBenefit, ...otherBenefits] = content.items;
  const FeaturedBenefitIcon = featuredBenefit?.icon;

  return (
    <section id={content.id} className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(216,187,123,0.12),transparent_62%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,rgba(31,91,73,0.08),transparent_60%)]" />

      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_1.04fr] xl:gap-8 2xl:grid-cols-[minmax(0,1fr)_1fr] 2xl:gap-10">
          <Card className="relative overflow-hidden rounded-[40px] border-[#163b2f] bg-[linear-gradient(160deg,#123227_0%,#0b1d17_100%)] p-8 text-white shadow-[0_34px_100px_rgba(7,15,12,0.26)] sm:p-10 lg:p-11">
            <div className="absolute -right-16 top-0 h-44 w-44 rounded-full bg-[#d8bb7b]/14 blur-3xl" />
            <div className="absolute -left-14 bottom-0 h-40 w-40 rounded-full bg-[#1f5b49]/24 blur-3xl" />

            <div className="relative space-y-7">
              <Badge className="w-fit border-[#d8bb7b]/20 bg-[#d8bb7b]/10 text-[#f4dfb2] shadow-[0_10px_30px_rgba(216,187,123,0.08)]">
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

              <div className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-[0_20px_44px_rgba(3,9,7,0.1)] backdrop-blur">
                <h3 className="text-xl font-semibold text-white">
                  {content.spotlight.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  {content.spotlight.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {content.spotlight.checklist.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-white/72">
                      <CheckCircle2 className="mt-0.5 size-5 text-[#d8bb7b]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8bb7b]">
                    Resultado prático
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    Menos esforço com processos manuais e mais fluidez para a rotina.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d8bb7b]">
                    Ganho institucional
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    Mais organização, clareza e segurança para acompanhar a operação.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {featuredBenefit ? (
              <Card className="overflow-hidden rounded-[34px] border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(247,243,235,0.94)_100%)] p-8 shadow-[0_24px_74px_rgba(18,38,31,0.08)] md:col-span-2">
                <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-[#c7a76a]/18 bg-[#c7a76a]/10 text-[#b78743]">
                    {FeaturedBenefitIcon ? <FeaturedBenefitIcon className="size-6" /> : null}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b78743]">
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

            {otherBenefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className={cn(
                    "overflow-hidden rounded-[32px] border-white/70 p-6 shadow-[0_20px_62px_rgba(18,38,31,0.08)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_28px_78px_rgba(18,38,31,0.12)]",
                    index % 3 === 1
                      ? "bg-[linear-gradient(160deg,#123227_0%,#0b1d17_100%)] text-white"
                      : "bg-white/[0.84] text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-2xl border",
                      index % 3 === 1
                        ? "border-[#d8bb7b]/20 bg-[#d8bb7b]/10 text-[#f4dfb2]"
                        : "border-[#c7a76a]/18 bg-[#c7a76a]/10 text-[#b78743]",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-3 text-sm leading-7",
                      index % 3 === 1 ? "text-white/72" : "text-muted-foreground",
                    )}
                  >
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
