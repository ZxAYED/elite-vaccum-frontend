"use client";

import { Mail, MessageSquare, PhoneCall } from "lucide-react";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import ContactInfoCard from "./ContactInfoCard";

const contactInfo = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Use the form for the fastest routing",
    actionLabel: "Start Request",
    href: "/contact",
  },
  {
    icon: PhoneCall,
    title: "Call Support",
    description: "Available for service questions",
    actionLabel: "Call Now",
    href: "tel:+8801902320296",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Direct inbox for support",
    actionLabel: "Send Email",
    href: "mailto:zzayediqbalofficial@gmail.com",
  },
];

export default function ContactInfoGrid() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <FadeIn y={20} duration={0.6}>
          <StaggerGroup className="grid gap-5 md:grid-cols-3" delay={0.05} once>
            {contactInfo.map((item) => (
              <StaggerItem key={item.title}>
                <ContactInfoCard {...item} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </FadeIn>
      </div>
    </section>
  );
}
