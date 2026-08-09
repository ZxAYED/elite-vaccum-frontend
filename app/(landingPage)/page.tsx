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
      <FadeIn y={24} once={false}>
        <HeroSection />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <PrimaryJourneyCards />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <FeaturedProductsSection />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <EngineeredSupportSection />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <HowItWorks />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <SmartIntegration />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <ProvenSection />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <TrustSection />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <CustomerAccessPanel />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <TestimonialsCarousel />
      </FadeIn>
      <FadeIn y={30} delay={0.03} once={false}>
        <ExperienceCard />
      </FadeIn>
    </main>
  );
}
