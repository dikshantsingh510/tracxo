import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BentoFeatures } from "@/components/marketing/bento-features";
import { CtaSection } from "@/components/marketing/cta-section";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { LiveDemoWidget } from "@/components/marketing/live-demo-widget";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { getSession } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Tracxo — split expenses without the awkward texts",
  description:
    "The calm, frosted, debt-simplifying expense tracker for groups of friends, flatmates, and travel crews.",
};

export default async function LandingPage() {
  // Signed-in visitors skip the marketing copy — bounce them into the app.
  const session = await getSession();
  if (session) redirect("/workspaces");

  return (
    <>
      <Hero />
      <TrustStrip />
      <BentoFeatures />
      <HowItWorks />
      <LiveDemoWidget />
      <Testimonials />
      <Pricing />
      <Faq />
      <CtaSection />
    </>
  );
}
