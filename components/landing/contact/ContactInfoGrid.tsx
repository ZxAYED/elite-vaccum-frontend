import { Mail, PhoneCall, MessageSquare } from "lucide-react";
import ContactInfoCard from "./ContactInfoCard";

export default function ContactInfoGrid() {
  const contactInfo = [
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Typically reply within 2 mins",
      actionLabel: "Start Chat",
      href: "#",
    },
    {
      icon: PhoneCall,
      title: "Call Support",
      description: "Mon–Sat, 11AM–9PM",
      actionLabel: "Call Now",
      href: "tel:+17185555555",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "24/7",
      actionLabel: "Send Email",
      href: "mailto:info@elitevacuum.com",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {contactInfo.map((item) => (
            <ContactInfoCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
