"use client";

import ContactBanner from "@/components/landing/common/ContactBanner";
import ContactForm from "@/components/landing/contact/ContactForm";
import ContactInfoGrid from "@/components/landing/contact/ContactInfoGrid";

export default function Contact() {
  return (
    <>
      <main>
        <ContactBanner />
        <ContactInfoGrid />
        <ContactForm />
      </main>
    </>
  );
}
