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
import { MotionSection } from "@/components/motion/MotionSection";

export default function Home() {
  return (
    <main className="bg-[var(--background)]">
      <MotionSection y={28} amount={0.08}>
        <HeroSection />
      </MotionSection>
      <MotionSection delay={0.04}>
        <PrimaryJourneyCards />
      </MotionSection>
      <MotionSection delay={0.04}>
        <FeaturedProductsSection />
      </MotionSection>
      <MotionSection delay={0.04}>
        <EngineeredSupportSection />
      </MotionSection>
      <MotionSection delay={0.04}>
        <HowItWorks />
      </MotionSection>
      <MotionSection delay={0.04}>
        <SmartIntegration />
      </MotionSection>
      <MotionSection delay={0.04}>
        <ProvenSection />
      </MotionSection>
      <MotionSection delay={0.04}>
        <TrustSection />
      </MotionSection>
      <MotionSection delay={0.04}>
        <CustomerAccessPanel />
      </MotionSection>
      <MotionSection delay={0.04}>
        <TestimonialsCarousel />
      </MotionSection>
      <MotionSection delay={0.04}>
        <ExperienceCard />
      </MotionSection>
    </main>
  );
}
