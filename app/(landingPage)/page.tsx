import { EngineeredSupportSection } from "@/components/landing/home/EngineeredSupportSection";
import ExperienceCard from "@/components/landing/home/ExperienceCard";
import { FeaturedProductsSection } from "@/components/landing/home/FeaturedProductsSection";
import { HeroSection } from "@/components/landing/home/HeroSection";
import HowItWorks from "@/components/landing/home/HowItWorks";
import { PrimaryJourneyCards } from "@/components/landing/home/PrimaryJourneyCards";
import ProvenSection from "@/components/landing/home/ProvenSection";
import SmartIntegration from "@/components/landing/home/SmartIntegration";
import { TestimonialsCarousel } from "@/components/landing/home/TestimonialsCarousel";
import { TrustSection } from "@/components/landing/home/TrustSection";
import { CustomerAccessPanel } from "@/components/landing/home/CustomerAccessPanel";
import { FadeIn } from "@/components/motion/Animated";

export default function Home() {
  return (
    <main className="bg-[var(--background)]">
      <FadeIn y={18}>
        <HeroSection />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <PrimaryJourneyCards />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <FeaturedProductsSection />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <EngineeredSupportSection />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <HowItWorks />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <SmartIntegration />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <ProvenSection />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <TrustSection />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <CustomerAccessPanel />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <TestimonialsCarousel />
      </FadeIn>
      <FadeIn y={34} delay={0.04}>
        <ExperienceCard />
      </FadeIn>
    </main>
  );
}
