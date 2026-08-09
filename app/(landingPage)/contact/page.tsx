"use client";

import ContactBanner from "@/components/landing/common/ContactBanner";
import ContactForm from "@/components/landing/contact/ContactForm";
import ContactInfoGrid from "@/components/landing/contact/ContactInfoGrid";
import { MotionSection } from "@/components/motion/MotionSection";

export default function Contact() {
  return (
    <>
      <main>
        {/* Hero Section */}
        <MotionSection y={30} amount={0.08}>
          <ContactBanner />
        </MotionSection>

        {/* Contact Info Grid */}
        <MotionSection>
          <ContactInfoGrid />
        </MotionSection>

        {/* Main Contact Form */}
        <MotionSection>
          <ContactForm />
        </MotionSection>
      </main>
    </>
  );
}
