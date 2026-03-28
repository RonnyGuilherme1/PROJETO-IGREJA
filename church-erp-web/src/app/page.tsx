import type { Metadata } from "next";
import { LandingPage } from "@/modules/marketing/components/landing-page";

export const metadata: Metadata = {
  title: "Igreja ERP",
  description:
    "Landing page institucional do Igreja ERP com foco comercial, visual premium e CTA direto para WhatsApp.",
};

export default function HomePage() {
  return <LandingPage />;
}
