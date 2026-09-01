"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

import facebookImage from "@/public/common/facebook.png";
import instaImage from "@/public/common/instagram.png";
import linkedinImage from "@/public/common/linkedin.png";
import logo from "@/public/logo-white.png";

const footerLinks = {
  explore: [
    { label: "Home", href: "/" },
    { label: "Store", href: "/store" },
    { label: "Services", href: "/services" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  services: [
    { label: "Vacuum Repair", href: "/services/request?service=vacuum-repair" },
    { label: "Maintenance", href: "/services/request?service=maintenance" },
    { label: "Installation", href: "/services/request?service=new-system" },
    {
      label: "System Inspection",
      href: "/services/request?service=system-inspection",
    },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Accessibility", href: "/accessibility" },
  ],
};

const contactLinks = [
  {
    icon: MapPin,
    label: "Service coverage available by request",
    href: "/contact",
  },
  {
    icon: Smartphone,
    label: "01902320296",
    href: "tel:+8801902320296",
  },
  {
    icon: Mail,
    label: "zzayediqbalofficial@gmail.com",
    href: "mailto:zzayediqbalofficial@gmail.com",
  },
];

const socialLinks = [
  { label: "Facebook", href: "#", image: facebookImage },
  { label: "Instagram", href: "#", image: instaImage },
  { label: "LinkedIn", href: "#", image: linkedinImage },
];

const motionTransition = { type: "spring", stiffness: 400, damping: 17 } as const;

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-360 px-4 py-12">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.8 }}
              className="inline-block origin-left"
              transition={motionTransition}
            >
              <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                <Image src={logo} alt="Elite Central Vacuum" />
              </Link>
            </motion.div>
            <p className="mt-4 max-w-xs text-sm text-primary-foreground/80">
              Professional central vacuum product guidance, service requests,
              and customer account tools.
            </p>
          </div>

          <FooterLinkGroup title="Explore" links={footerLinks.explore} />
          <FooterLinkGroup title="Services" links={footerLinks.services} />

          <div>
            <h3 className="mb-4 font-bold">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              {contactLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.li
                    className="flex gap-3 origin-left"
                    key={item.href}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.8 }}
                    transition={motionTransition}
                  >
                    <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <Link
                      href={item.href}
                      className="break-words text-primary-foreground/85 transition-colors hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/25 py-8">
          <div className="mx-auto grid w-full max-w-400 items-center gap-6 text-center md:grid-cols-3 md:text-left">
            <p className="text-sm text-primary-foreground/80">
              © 2025 | ELITE CENTRAL VACUUM SERVICES LLC.
            </p>

            <ul className="flex flex-col items-center justify-center gap-3 text-sm md:flex-row md:gap-6">
              {footerLinks.legal.map((link) => (
                <motion.li
                  key={link.href}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.8 }}
                  transition={motionTransition}
                >
                  <Link
                    href={link.href}
                    className="text-primary-foreground/80 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>

            <div className="flex justify-center gap-4 md:justify-end">
              {socialLinks.map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.8 }}
                  transition={motionTransition}
                >
                  <Link
                    href={link.href}
                    className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                    aria-label={link.label}
                  >
                    <Image src={link.image} alt="" aria-hidden="true" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="mb-4 font-bold">{title}</h3>
      <ul className="space-y-2 text-sm">
        {links.map((link) => (
          <motion.li
            key={link.href}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.8 }}
            className="origin-left"
            transition={motionTransition}
          >
            <Link
              href={link.href}
              className="inline-block text-primary-foreground/85 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

