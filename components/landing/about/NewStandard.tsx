import Image from "next/image";
import { Eye, Target, ShieldCheck } from "lucide-react";
import about from "@/public/landing/about/about.png";

import { FadeIn, StaggerGroup, StaggerItem } from "@/components/motion/Animated";

export default function NewStandard() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-[#F9F9F9]">
      <div className="max-w-360 mx-auto px-5 sm:px-6 lg:px-8">
        <FadeIn
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start"
          once={false}
        >
          {/* Left: Text + Stats */}
          <div className="space-y-10">
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary leading-tight">
                A new standard for
                <br />
                home services.
              </h2>

              <p className="mt-6 text-base md:text-lg text-[#6C7787] max-w-3xl leading-relaxed ">
                Elite was born out of frustration with the standard repair
                experience. We saw a world of slow callbacks, opaque pricing,
                and inconsistent quality in the built-in vacuum industry.
              </p>

              <p className="mt-6 text-base md:text-lg text-gray-700 max-w-3xl leading-relaxed">
                We decided to fix it using technology. By building an
                intelligent booking platform and certifying the nation&apos;s
                top technicians, we&apos;ve created the first premium-tier
                service network designed specifically for the modern homeowner.
              </p>
            </div>

            {/* Stats */}
            <StaggerGroup className="flex flex-wrap gap-12 md:gap-16" delay={0.08} once={false}>
              <StaggerItem>
                <div className="text-center md:text-left mx-auto md:mx-0">
                <div className="text-xl font-bold text-primary text-center">
                  15 yr
                </div>
                <p className="mt-2 text-lg font-medium text-[#6C7787]">
                  INDUSTRY EXPERIENCE
                </p>
                </div>
              </StaggerItem>

              <StaggerItem>
                <div className="text-center md:text-left mx-auto md:mx-0">
                <div className="text-xl font-bold text-primary text-center">
                  100%
                </div>
                <p className="mt-2 text-lg font-medium text-[#6C7787]">
                  SERVICE GUARANTEE
                </p>
                </div>
              </StaggerItem>
            </StaggerGroup>
          </div>

          {/* Right: Image with Verified Badge */}
          <div className="relative overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src={about}
              alt="Technician using smart device for home service diagnostics in modern home"
              width={1080}
              height={1080}
              className="h-auto w-full object-cover"
            />

            {/* Overlay gradient for text readability if needed */}
            <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-60" />

            {/* Verified Secure Badge */}
            <div className="absolute bottom-0  right-6 bg-[#E8EDEE] backdrop-blur-sm px-5 py-3 rounded-full shadow-lg flex items-center gap-3 border border-teal-200">
              <ShieldCheck className="text-primary" size={24} />
              <span className="font-semibold text-gray-800">
                Verified Secure
              </span>
            </div>
          </div>
        </FadeIn>

        {/* Vision & Mission Cards */}
        <StaggerGroup className="grid md:grid-cols-2 gap-8 mt-16 lg:mt-20" delay={0.08} once={false}>
          {/* Vision */}
          <StaggerItem>
            <div className=" border border-teal-100 rounded-2xl p-8 md:p-10 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-left   gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <Eye className="text-teal-700" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              To make luxury home maintenance as simple as a single tap,
              ensuring healthy living environments for every premium property.
            </p>
            </div>
          </StaggerItem>

          {/* Mission */}
          <StaggerItem>
            <div className=" border border-teal-100 rounded-2xl p-8 md:p-10 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-left gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <Target className="text-teal-700" size={28} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                Our Mission
              </div>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              Bridging high-end hardware and expert service through transparent
              pricing, certified talent, and smart tech.
            </p>
            </div>
          </StaggerItem>
        </StaggerGroup>
      </div>
    </section>
  );
}
