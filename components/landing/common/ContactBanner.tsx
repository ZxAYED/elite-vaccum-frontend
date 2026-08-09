import Image from "next/image";

import { StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import bannerImage from "@/public/landing/contact/contact.png";

export default function ContactBanner() {
  return (
    <section className="relative flex min-h-[340px] items-center overflow-hidden bg-[#F9F9F9] text-primary md:min-h-[430px]">
      <Image
        src={bannerImage}
        alt="Elite support specialist background"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,65,66,0.88)_0%,rgba(7,65,66,0.64)_42%,rgba(7,65,66,0.22)_100%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4">
        <StaggerGroup className="max-w-xl" delay={0.08} once={false}>
          <StaggerItem>
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#BCFF56] ring-1 ring-white/15">
              CALL & CHATS
            </div>
          </StaggerItem>
          <StaggerItem>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
              Contact Us
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/90 md:text-lg">
              We are here to help you anytime. Choose your preferred way to reach
              our specialists.
            </p>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  );
}
