import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LandingFeaturesContent } from "@/modules/marketing/data/landing-content";

interface LandingFeaturesProps {
  content: LandingFeaturesContent;
}

const featureToneClasses = [
  {
    icon: "border-primary/14 bg-primary/8 text-primary",
    line: "bg-primary/75",
  },
  {
    icon: "border-accent/20 bg-accent/10 text-accent",
    line: "bg-accent/75",
  },
  {
    icon: "border-border bg-secondary text-primary",
    line: "bg-primary/40",
  },
] as const;

export function LandingFeatures({ content }: LandingFeaturesProps) {
  return (
    <section id={content.id} className="relative scroll-mt-28 overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/5 to-transparent" />

      <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
        <div className="flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between xl:gap-12">
          <div className="max-w-4xl space-y-5">
            <Badge className="w-fit border-accent/20 bg-accent/10 text-accent">
              {content.eyebrow}
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.85rem] lg:leading-[1.08]">
              {content.title}
            </h2>
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">
              {content.description}
            </p>
          </div>

          <Card className="w-full rounded-[28px] border-border bg-[var(--marketing-panel-soft)] p-6 shadow-[0_14px_34px_rgba(24,35,30,0.06)] xl:max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Funcionalidades principais
            </p>
            <p className="mt-3 text-base leading-7 text-foreground">
              Cards amplos, leitura clara e foco no que realmente sustenta a
              rotina administrativa da igreja.
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
                className="group relative overflow-hidden rounded-[30px] border-border bg-card p-7 shadow-[0_14px_38px_rgba(24,35,30,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/18 hover:bg-[var(--marketing-panel-soft)] hover:shadow-[0_20px_46px_rgba(20,53,43,0.1)] md:min-h-[300px]"
              >
                <div className={cn("absolute left-7 top-0 h-[3px] w-16 rounded-full", tone.line)} />

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
                    <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.description}
                  </p>

                  <div className="mt-auto pt-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                    Essencial para a operacao
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
