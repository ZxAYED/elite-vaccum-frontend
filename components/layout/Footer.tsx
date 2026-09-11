"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import facebookImage from "@/public/common/facebook.png";
import instaImage from "@/public/common/instagram.png";
import linkedinImage from "@/public/common/linkedin.png";
import logo from "@/public/logo-white.png";

const footerLinks = {
  explore: [
    { label: "Home", href: "/" },
    { label: "Store", href: "/store" },
    { label: "Services", href: "/services" },
    { label: "FAQs", href: "/faqs" },
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
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Warranty & Guarantee", href: "/warranty" },
    { label: "Accessibility", href: "/accessibility" },
  ],
};

const contactLinks = [
  {
    icon: MapPin,
    label: "Service coverage available by request",
    href: "/contact",
    isEmail: false,
  },
  {
    icon: Smartphone,
    label: "+880 1902-320296",
    href: "tel:+8801902320296",
    isEmail: false,
  },
  {
    icon: Mail,
    label: "zzayediqbalofficial@gmail.com",
    href: "mailto:zzayediqbalofficial@gmail.com",
    isEmail: true,
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
      <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-14">
          <div className="space-y-4">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block origin-left"
              transition={motionTransition}
            >
              <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                <Image src={logo} alt="Elite Central Vacuum" priority className="h-auto w-32 object-contain" />
              </Link>
            </motion.div>
            <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/80">
              Professional central vacuum product guidance, certified service requests,
              and customer account management tools.
            </p>
          </div>

          <FooterLinkGroup title="Explore" links={footerLinks.explore} />
          <FooterLinkGroup title="Services" links={footerLinks.services} />

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-teal-300">Contact Us</h3>
            <ul className="space-y-3.5 text-sm">
              {contactLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.li
                    className="flex min-w-0 items-start gap-3 origin-left"
                    key={item.href}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    transition={motionTransition}
                  >
                    <Icon className="mt-0.5 size-4.5 shrink-0 text-teal-300" aria-hidden="true" />
                    <Link
                      href={item.href}
                      className={cn(
                        "min-w-0 text-primary-foreground/85 transition-colors hover:text-accent",
                        item.isEmail ? "break-all text-xs sm:text-sm" : "break-words leading-snug",
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
            <p className="text-xs text-primary-foreground/75 sm:text-sm">
              © {new Date().getFullYear()} | ELITE CENTRAL VACUUM SERVICES LLC. All rights reserved.
            </p>

            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm">
              {footerLinks.legal.map((link) => (
                <motion.li
                  key={link.href}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
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

            <div className="flex items-center justify-center gap-3">
              {socialLinks.map((link) => (
                <motion.div
                  key={link.label}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  transition={motionTransition}
                >
                  <Link
                    href={link.href}
                    className="flex size-9.5 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                    aria-label={link.label}
                  >
                    <Image src={link.image} alt="" aria-hidden="true" className="size-4.5 object-contain" />
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

