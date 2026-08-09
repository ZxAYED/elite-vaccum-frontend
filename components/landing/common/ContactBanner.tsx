import bannerImage from "@/public/landing/contact/contact.png";
import Image from "next/image";

import { StaggerGroup, StaggerItem } from "@/components/motion/Animated";

export default function ContactBanner() {
  return (
    <section className="relative min-h-96 md:min-h-[55vh] flex items-center text-primary overflow-hidden  bg-[#F9F9F9]">
      <Image
        src={bannerImage}
        alt="Banner background"
        fill
        priority
        sizes="100vw"
        className="md:object-cover"
      />
      {/* Overlay – makes text readable */}
      <div className="absolute inset-0 bg-black/15" />
      <section className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-24 absolute inset-0">
        <div className="max-w-360 mx-auto px-4">
          <StaggerGroup className="max-w-2xl" delay={0.08}>
            <StaggerItem>
              <div className="inline-block rounded-full px-4 py-2 text-lg font-medium text-[#BCFF56]">
                CALL & CHATS
              </div>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mb-6 text-4xl font-semibold text-white md:text-5xl lg:text-7xl">
                Contact Us
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="text-xl text-white">
                We are here to help you anytime. Choose your preferred way to reach
                our specialists.
              </p>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>
    </section>
  );
}
