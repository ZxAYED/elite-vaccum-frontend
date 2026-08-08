import EliteSection from "@/components/landing/about/EliteSection";
import NewStandard from "@/components/landing/about/NewStandard";
import AboutBanner from "@/components/landing/common/AboutBanner";
import { Award, Users, Zap, CheckCircle, Heart } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Elite - Central Vacuum Services",
  description:
    "Learn about Elite Central Vacuum Services, our mission, values, and commitment to excellence.",
};

export default function About() {
  const values = [
    {
      icon: Award,
      title: "Excellence",
      description:
        "We maintain the highest standards in every service we provide.",
    },
    {
      icon: Users,
      title: "Customer Focus",
      description:
        "Your satisfaction is our top priority and measure of success.",
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously improve our techniques and equipment.",
    },
    {
      icon: Heart,
      title: "Integrity",
      description: "Honest pricing, transparent communication, always.",
    },
  ];

  const stats = [
    { number: "15+", label: "Years Experience" },
    { number: "8,200+", label: "Happy Clients" },
    { number: "99%", label: "Satisfaction Rate" },
    { number: "500+", label: "Projects Completed" },
  ];

  return (
    <>
      <main>
        {/* Hero Section */}
        <AboutBanner />
        <NewStandard />
        <EliteSection />

        {/* CTA Section */}
        <section className="bg-[#F9F9F9] text-black py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              Work with the best.
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto text-primary">
              Experience the most sophisticated vacuum service in the industry.
              Your home deserves the Elite standard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent text-accent-foreground px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
                Schedule Service
              </button>
              <Link
                href="/contact"
                className="border border-primary! text-primary px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-primary transition-colors"
              >
                Contact Our Team
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
