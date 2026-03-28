import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LandingFeaturesContent } from "@/modules/marketing/data/landing-content";

interface LandingFeaturesProps {
  content: LandingFeaturesContent;
}

const featureToneClasses = [
  {
    card: "bg-[linear-gradient(160deg,#123227_0%,#0b1d17_100%)] border-[#15362b] text-white shadow-[0_28px_80px_rgba(7,15,12,0.22)]",
    icon: "border-[#d8bb7b]/20 bg-[#d8bb7b]/10 text-[#f4dfb2]",
    text: "text-white/72",
    line: "bg-[linear-gradient(90deg,rgba(216,187,123,0.72),transparent)]",
  },
  {
    card: "bg-white/88 border-white/70 text-foreground shadow-[0_20px_60px_rgba(18,38,31,0.08)]",
    icon: "border-[#1f5b49]/12 bg-[#1f5b49]/8 text-[#1f5b49]",
    text: "text-muted-foreground",
    line: "bg-[linear-gradient(90deg,rgba(31,91,73,0.6),transparent)]",
  },
  {
    card: "bg-[linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(247,243,235,0.92)_100%)] border-white/70 text-foreground shadow-[0_20px_60px_rgba(18,38,31,0.08)]",
    icon: "border-[#c7a76a]/18 bg-[#c7a76a]/10 text-[#b78743]",
    text: "text-muted-foreground",
    line: "bg-[linear-gradient(90deg,rgba(199,167,106,0.65),transparent)]",
  },
] as const;

export function LandingFeatures({ content }: LandingFeaturesProps) {
  return (
    <section id={content.id} className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-52 bg-[radial-gradient(circle_at_top,rgba(31,91,73,0.08),transparent_65%)]" />
      <div className="absolute inset-y-0 left-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(216,187,123,0.08),transparent_58%)]" />

      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between xl:gap-12">
          <div className="max-w-4xl space-y-5">
            <Badge className="w-fit border-[#c7a76a]/20 bg-[#c7a76a]/10 text-[#b78743] shadow-[0_10px_30px_rgba(199,167,106,0.08)]">
              {content.eyebrow}
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.85rem] lg:leading-[1.08]">
              {content.title}
            </h2>
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">
              {content.description}
            </p>
          </div>

          <Card className="w-full rounded-[32px] border-white/70 bg-white/[0.82] p-6 shadow-[0_18px_54px_rgba(18,38,31,0.08)] backdrop-blur-sm xl:max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b78743]">
              Funcionalidades principais
            </p>
            <p className="mt-3 text-base leading-7 text-foreground">
              Cards amplos, leitura clara e foco no que realmente sustenta a rotina
              administrativa da igreja.
            </p>
          </Card>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:gap-7">
          {content.items.map((item, index) => {
            const Icon = item.icon;
            const tone = featureToneClasses[index % featureToneClasses.length];

            return (
              <Card
                key={item.title}
                className={cn(
                  "group relative overflow-hidden rounded-[32px] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_84px_rgba(18,38,31,0.14)] md:min-h-[320px]",
                  tone.card,
                )}
              >
                <div className={cn("absolute left-6 top-0 h-px w-28", tone.line)} />
                <div className="absolute -right-10 top-6 h-24 w-24 rounded-full bg-white/8 blur-2xl" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={cn(
                        "flex size-12 items-center justify-center rounded-2xl border",
                        tone.icon,
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full border border-current/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-current/55">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className={cn("mt-3 text-sm leading-7", tone.text)}>
                    {item.description}
                  </p>

                  <div className="mt-auto pt-8 text-xs font-semibold uppercase tracking-[0.2em] text-current/40">
                    Essencial para a operação
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
