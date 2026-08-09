import EliteSection from "@/components/landing/about/EliteSection";
import NewStandard from "@/components/landing/about/NewStandard";
import AboutBanner from "@/components/landing/common/AboutBanner";
import { Pressable } from "@/components/motion/Animated";
import {
  MotionSection,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/motion/MotionSection";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export const metadata = {
  title: "About Elite - Central Vacuum Services",
  description:
    "Learn about Elite Central Vacuum Services, our mission, values, and commitment to excellence.",
};

export default function About() {
  return (
    <>
      <main>
        {/* Hero Section */}
        <MotionSection y={30} amount={0.08}>
          <AboutBanner />
        </MotionSection>
        <MotionSection>
          <NewStandard />
        </MotionSection>
        <MotionSection>
          <EliteSection />
        </MotionSection>

        {/* CTA Section */}
        <section className="bg-[#F9F9F9] text-black py-16 md:py-20">
          <MotionStagger
            className="max-w-4xl mx-auto px-4 text-center"
            delay={0.06}
            once={false}
          >
            <MotionStaggerItem>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
                Work with the best.
              </h2>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <p className="text-lg mb-8 max-w-2xl mx-auto text-primary">
                Experience the most sophisticated vacuum service in the industry.
                Your home deserves the Elite standard.
              </p>
            </MotionStaggerItem>
            <MotionStaggerItem>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Pressable>
                  <Button asChild size="pill">
                    <Link href="/services">Schedule Service</Link>
                  </Button>
                </Pressable>
                <Pressable>
                  <Button asChild size="pill" variant="outline">
                    <Link href="/contact">Contact Our Team</Link>
                  </Button>
                </Pressable>
              </div>
            </MotionStaggerItem>
          </MotionStagger>
        </section>
      </main>
    </>
  );
}
