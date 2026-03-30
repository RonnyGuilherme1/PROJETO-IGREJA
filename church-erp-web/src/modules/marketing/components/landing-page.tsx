import { LandingAbout } from "@/modules/marketing/components/landing-about";
import { LandingBenefits } from "@/modules/marketing/components/landing-benefits";
import { LandingCta } from "@/modules/marketing/components/landing-cta";
import { LandingFeatures } from "@/modules/marketing/components/landing-features";
import { LandingFooter } from "@/modules/marketing/components/landing-footer";
import { LandingHeader } from "@/modules/marketing/components/landing-header";
import { LandingHero } from "@/modules/marketing/components/landing-hero";
import { landingContent } from "@/modules/marketing/data/landing-content";

export function LandingPage() {
  return (
    <div className="relative overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[linear-gradient(180deg,var(--marketing-hero-start)_0%,var(--marketing-hero-end)_58%,var(--background)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,var(--marketing-glow-soft),transparent_46%)]" />

      <div className="relative">
        <LandingHeader
          brandName={landingContent.brandName}
          brandLabel={landingContent.brandLabel}
          navigation={landingContent.navigation}
          loginAction={landingContent.hero.secondaryAction}
        />

        <main className="relative z-10">
          <LandingHero content={landingContent.hero} />

          <div className="relative border-t border-border/50 bg-background">
            <LandingAbout content={landingContent.about} />
          </div>

          <div className="relative border-y border-border/50 bg-[var(--marketing-panel-soft)]">
            <LandingFeatures content={landingContent.features} />
          </div>

          <div className="relative bg-background">
            <LandingBenefits content={landingContent.benefits} />
          </div>

          <div className="relative border-t border-border/50 bg-[var(--marketing-panel-muted)]">
            <LandingCta content={landingContent.cta} />
          </div>
        </main>

        <LandingFooter
          brandName={landingContent.brandName}
          content={landingContent.footer}
          navigation={landingContent.navigation}
        />
      </div>
    </div>
  );
}
