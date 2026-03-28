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
      <div className="absolute inset-x-0 top-0 h-[860px] bg-[radial-gradient(circle_at_top,rgba(199,167,106,0.2),transparent_30%),radial-gradient(circle_at_top_left,rgba(31,91,73,0.42),transparent_26%),linear-gradient(180deg,#08140f_0%,#10271f_100%)] lg:h-[920px]" />
      <div className="absolute inset-x-0 top-[42rem] h-96 bg-[radial-gradient(circle,rgba(199,167,106,0.09),transparent_60%)]" />
      <div className="absolute inset-x-0 top-[88rem] h-[28rem] bg-[linear-gradient(180deg,transparent_0%,rgba(255,255,255,0.42)_16%,rgba(244,246,241,0.96)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[42rem] bg-[radial-gradient(circle_at_bottom,rgba(31,91,73,0.08),transparent_58%)]" />

      <div className="relative">
        <LandingHeader
          brandName={landingContent.brandName}
          brandLabel={landingContent.brandLabel}
          navigation={landingContent.navigation}
          loginAction={landingContent.hero.secondaryAction}
        />

        <main className="relative z-10">
          <LandingHero content={landingContent.hero} />

          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(11,29,23,0)_0%,rgba(244,246,241,0.94)_100%)]" />
            <LandingAbout content={landingContent.about} />
          </div>

          <div className="relative bg-[linear-gradient(180deg,rgba(244,246,241,0.9)_0%,rgba(248,246,240,0.98)_100%)]">
            <LandingFeatures content={landingContent.features} />
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(31,91,73,0.08),transparent_68%)]" />
            <LandingBenefits content={landingContent.benefits} />
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,rgba(244,246,241,0)_0%,rgba(8,21,16,0.16)_100%)]" />
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
