import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logo-white.png";
import facebookImage from "@/public/common/facebook.png";
import instaImage from "@/public/common/instagram.png";
import linkedinImage from "@/public/common/linkedin.png";
import { Mail, MapPin, Smartphone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-360 mx-auto px-4 py-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl text-primary"
            >
              <Image src={logo} alt="logo png" />
            </Link>
            <p className="text-sm text-primary-foreground/80">
              Professional central vacuum installation, repair, and maintenance
              since 2015.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-accent transition-colors"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-accent transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-accent transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/services"
                  className="hover:text-accent transition-colors"
                >
                  Repair & Diagnostics
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-accent transition-colors"
                >
                  New System Setup
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-accent transition-colors"
                >
                  Maintenance
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-accent transition-colors"
                >
                  Installation
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="">
            <h3 className="font-bold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-sm ">
              <li className="flex gap-4">
                <MapPin />
                <a href="#" className="hover:text-accent transition-colors">
                  123 Elite Plaza, Wellness Drive Greenwich, CT 06830
                </a>
              </li>

              <li className="flex gap-4">
                <Smartphone />
                <a
                  href="tel:+1880555-465215"
                  className="hover:text-accent transition-colors"
                >
                  +1 (880) 555-465215
                </a>
              </li>
              <li className="flex gap-4">
                <Mail />
                <a
                  href="mailto:info@elitevacuum.com"
                  className="hover:text-accent transition-colors"
                >
                  info@elitevacuum.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#AAB1BA]! py-8 ">
          {/* Bottom Section */}
          <div className="w-full max-w-400 mx-auto  py-8 grid md:grid-cols-3 items-center gap-6 text-center md:text-left">
            {/* Copyright */}
            <p className="text-sm text-primary-foreground/80 md:text-left">
              © 2025 | ELITE CENTRAL VACCUM SERVICES LLC.
            </p>

            {/* Links */}
            <ul className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-3 md:gap-6 text-sm md:pl-36">
              <li>
                <Link href="/" className="hover:text-accent transition-colors">
                  PRIVACY
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-accent transition-colors">
                  TEAMS
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-accent transition-colors">
                  ACCESSIBILITY
                </Link>
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex justify-center md:justify-end gap-4">
              <Link
                href="#"
                className="w-10 h-10  bg-opacity-10 rounded-full flex items-center justify-center hover:bg-opacity-20 transition-colors"
                aria-label="Facebook"
              >
                <Image src={facebookImage} alt="Facebook Logo" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10  bg-opacity-10 rounded-full flex items-center justify-center hover:bg-opacity-20 transition-colors"
                aria-label="Instagram"
              >
                <Image src={instaImage} alt="Instagram Logo" />
              </Link>
              <Link
                href="#"
                className="w-10 h-10  bg-opacity-10 rounded-full flex items-center justify-center hover:bg-opacity-20 transition-colors"
                aria-label="LinkedIn"
              >
                <Image src={linkedinImage} alt="Facebook Logo" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
