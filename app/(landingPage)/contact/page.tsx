"use client";

import ContactBanner from "@/components/landing/common/ContactBanner";
import ContactForm from "@/components/landing/contact/ContactForm";
import ContactInfoGrid from "@/components/landing/contact/ContactInfoGrid";

export default function Contact() {
  return (
    <>
      <main>
        {/* Hero Section */}
        <ContactBanner />

        {/* Contact Info Grid */}
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4">
            <ContactInfoGrid />

            {/* Main Contact Form */}
            <ContactForm />
          </div>
        </section>
      </main>
    </>
  );
}
