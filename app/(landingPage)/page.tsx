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

export default function Home() {
  return (
    <main className="bg-[var(--background)]">
      <HeroSection />
      <PrimaryJourneyCards />
      <FeaturedProductsSection />
      <EngineeredSupportSection />
      <HowItWorks />
      <SmartIntegration />
      <ProvenSection />
      <TrustSection />
      <CustomerAccessPanel />
      <TestimonialsCarousel />
      <ExperienceCard />
    </main>
  );
}
