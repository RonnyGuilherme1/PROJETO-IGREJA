import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LandingAboutContent } from "@/modules/marketing/data/landing-content";

interface LandingAboutProps {
  content: LandingAboutContent;
}

const summaryPoints = [
  "Organização administrativa",
  "Clareza para acompanhar a operação",
  "Praticidade para o dia a dia",
] as const;

export function LandingAbout({ content }: LandingAboutProps) {
  const [featuredPillar, ...supportingPillars] = content.pillars;
  const FeaturedPillarIcon = featuredPillar?.icon;

  return (
    <section id={content.id} className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(216,187,123,0.12),transparent_62%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(31,91,73,0.06),transparent_62%)]" />

      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:gap-14 2xl:grid-cols-[minmax(0,1.12fr)_minmax(520px,0.88fr)]">
          <div className="space-y-7">
            <Badge className="w-fit border-[#c7a76a]/20 bg-[#c7a76a]/10 text-[#b78743] shadow-[0_10px_30px_rgba(199,167,106,0.08)]">
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

            <Card className="overflow-hidden rounded-[38px] border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(247,243,235,0.94)_100%)] p-8 shadow-[0_28px_78px_rgba(18,38,31,0.09)] sm:p-9">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b78743]">
                    O que é o Igreja ERP
                  </p>
                  <p className="text-lg leading-8 text-foreground sm:text-xl">
                    Uma solução pensada para dar mais ordem à administração da igreja,
                    reunir informações importantes em um só ambiente e tornar a rotina
                    mais clara para quem acompanha a operação.
                  </p>
                </div>

                <div className="grid gap-3">
                  {summaryPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-[22px] border border-[#1f5b49]/10 bg-white/78 px-4 py-3.5 text-sm font-medium text-foreground shadow-[0_12px_34px_rgba(18,38,31,0.05)]"
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
              <Card className="relative overflow-hidden rounded-[38px] border-[#15362b] bg-[linear-gradient(160deg,#123227_0%,#0b1d17_100%)] p-8 text-white shadow-[0_30px_86px_rgba(7,15,12,0.24)] sm:p-9 md:col-span-2">
                <div className="absolute -right-14 top-0 h-40 w-40 rounded-full bg-[#d8bb7b]/14 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[#1f5b49]/26 blur-3xl" />

                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-xl space-y-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl border border-[#d8bb7b]/18 bg-[#d8bb7b]/10 text-[#f4dfb2]">
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

                  <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_40px_rgba(3,9,7,0.1)] backdrop-blur">
                    <div className="space-y-3">
                      {summaryPoints.map((item) => (
                        <div key={item} className="flex items-start gap-3 text-sm text-white/72">
                          <CheckCircle2 className="mt-0.5 size-4 text-[#d8bb7b]" />
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
                  className="overflow-hidden rounded-[32px] border-white/70 bg-white/[0.84] p-6 shadow-[0_20px_58px_rgba(18,38,31,0.08)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_28px_74px_rgba(18,38,31,0.12)]"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-[#c7a76a]/18 bg-[#c7a76a]/10 text-[#b78743]">
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
