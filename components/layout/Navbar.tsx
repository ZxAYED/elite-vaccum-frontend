"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/public/logo.png";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinkClass = (href: string) =>
    `text-base transition-colors ${
      pathname === href
        ? "font-bold text-[#0F2E2F]"
        : "text-[#1C4F50] hover:text-primary"
    }`;

  return (
    <header className="bg-white border-b border-gray-100! sticky top-0 z-50">
      <nav className="max-w-360 mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-primary"
        >
          <Image src={logo} alt="logo png" />
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          <Link href="/" className={navLinkClass("/")}>
            Home
          </Link>
          <Link href="/services" className={navLinkClass("/services")}>
            Services
          </Link>
          <Link href="/store" className={navLinkClass("/store")}>
            Store
          </Link>
          <Link href="/about" className={navLinkClass("/about")}>
            About
          </Link>
          <Link href="/contact" className={navLinkClass("/contact")}>
            Contact Us
          </Link>
        </div>

        <div className="flex gap-4 justify-center items-center">
          <Link href="/auth/login" className={navLinkClass("/login")}>
            sign in
          </Link>
          <Link
            href="/services"
            className="hidden lg:flex bg-primary text-primary-foreground px-6 py-2 rounded-full justify-center items-center gap-2 hover:opacity-90 transition-opacity font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 21 21"
              fill="none"
            >
              <path
                d="M9.92293 13.67L15.7529 19.5C16.2529 19.984 16.9231 20.2521 17.619 20.2465C18.3149 20.2408 18.9807 19.9619 19.4727 19.4698C19.9648 18.9777 20.2437 18.312 20.2494 17.6161C20.255 16.9202 19.9869 16.25 19.5029 15.75L13.6259 9.873M9.92293 13.67L12.4189 10.64C12.7359 10.256 13.1589 10.014 13.6269 9.874C14.1769 9.71 14.7899 9.686 15.3699 9.734C16.1518 9.80114 16.9375 9.66266 17.6493 9.33231C18.3611 9.00197 18.9741 8.49124 19.4276 7.85081C19.881 7.21037 20.1591 6.4625 20.2342 5.6814C20.3094 4.9003 20.179 4.11313 19.8559 3.398L16.5799 6.675C16.0318 6.54826 15.5303 6.27016 15.1326 5.87238C14.7348 5.47459 14.4567 4.9731 14.3299 4.425L17.6059 1.149C16.8908 0.825963 16.1036 0.695544 15.3225 0.770684C14.5414 0.845823 13.7936 1.12391 13.1531 1.57735C12.5127 2.03079 12.002 2.64381 11.6716 3.3556C11.3413 4.06738 11.2028 4.85317 11.2699 5.635C11.3609 6.711 11.1989 7.899 10.3659 8.585L10.2639 8.67M9.92293 13.67L5.26793 19.323C5.04232 19.598 4.76163 19.8227 4.44392 19.9827C4.12622 20.1427 3.77854 20.2344 3.42326 20.2518C3.06798 20.2693 2.71298 20.2122 2.3811 20.0842C2.04922 19.9562 1.74782 19.7602 1.49629 19.5086C1.24477 19.2571 1.0487 18.9557 0.920693 18.6238C0.79269 18.292 0.735594 17.9369 0.753081 17.5817C0.770567 17.2264 0.862248 16.8787 1.02222 16.561C1.1822 16.2433 1.40692 15.9626 1.68193 15.737L8.51893 10.107L4.41193 6H3.00293L0.752927 2.25L2.25293 0.75L6.00293 3V4.409L10.2629 8.669L8.51793 10.106M16.8779 16.875L14.2529 14.25M3.36993 17.625H3.37793V17.633H3.36993V17.625Z"
                stroke="#F9FAFB"
              />
            </svg>
            Book Service
          </Link>
        </div>

        <button
          className="lg:hidden cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {isOpen && (
        <div className="lg:hidden border-t border-gray-100!">
          <div className="flex flex-col gap-4 px-4 py-4">
            <Link
              href="/"
              className="text-[#1C4F50] text-base hover:text-primary! hover:text-bold transition-colors "
            >
              Home
            </Link>
            <Link
              href="/services"
              className="text-[#1C4F50] text-base hover:text-primary! hover:text-bold transition-colors "
            >
              Services
            </Link>
            <Link
              href="/store"
              className="text-[#1C4F50] text-base hover:text-primary! hover:text-bold transition-colors "
            >
              Store
            </Link>
            <Link
              href="/about"
              className="text-[#1C4F50] text-base hover:text-primary! hover:text-bold transition-colors "
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[#1C4F50] text-base hover:text-primary! hover:text-bold transition-colors "
            >
              Contact Us
            </Link>
            <Link
              href="/services"
              className="bg-primary text-primary-foreground px-6 py-2 flex justify-center gap-4 rounded-full hover:opacity-90 transition-opacity font-medium text-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
              >
                <path
                  d="M9.92293 13.67L15.7529 19.5C16.2529 19.984 16.9231 20.2521 17.619 20.2465C18.3149 20.2408 18.9807 19.9619 19.4727 19.4698C19.9648 18.9777 20.2437 18.312 20.2494 17.6161C20.255 16.9202 19.9869 16.25 19.5029 15.75L13.6259 9.873M9.92293 13.67L12.4189 10.64C12.7359 10.256 13.1589 10.014 13.6269 9.874C14.1769 9.71 14.7899 9.686 15.3699 9.734C16.1518 9.80114 16.9375 9.66266 17.6493 9.33231C18.3611 9.00197 18.9741 8.49124 19.4276 7.85081C19.881 7.21037 20.1591 6.4625 20.2342 5.6814C20.3094 4.9003 20.179 4.11313 19.8559 3.398L16.5799 6.675C16.0318 6.54826 15.5303 6.27016 15.1326 5.87238C14.7348 5.47459 14.4567 4.9731 14.3299 4.425L17.6059 1.149C16.8908 0.825963 16.1036 0.695544 15.3225 0.770684C14.5414 0.845823 13.7936 1.12391 13.1531 1.57735C12.5127 2.03079 12.002 2.64381 11.6716 3.3556C11.3413 4.06738 11.2028 4.85317 11.2699 5.635C11.3609 6.711 11.1989 7.899 10.3659 8.585L10.2639 8.67M9.92293 13.67L5.26793 19.323C5.04232 19.598 4.76163 19.8227 4.44392 19.9827C4.12622 20.1427 3.77854 20.2344 3.42326 20.2518C3.06798 20.2693 2.71298 20.2122 2.3811 20.0842C2.04922 19.9562 1.74782 19.7602 1.49629 19.5086C1.24477 19.2571 1.0487 18.9557 0.920693 18.6238C0.79269 18.292 0.735594 17.9369 0.753081 17.5817C0.770567 17.2264 0.862248 16.8787 1.02222 16.561C1.1822 16.2433 1.40692 15.9626 1.68193 15.737L8.51893 10.107L4.41193 6H3.00293L0.752927 2.25L2.25293 0.75L6.00293 3V4.409L10.2629 8.669L8.51793 10.106M16.8779 16.875L14.2529 14.25M3.36993 17.625H3.37793V17.633H3.36993V17.625Z"
                  stroke="#F9FAFB"
                />
              </svg>
              Book Service
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
