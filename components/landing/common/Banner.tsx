// components/sections/Hero.tsx
import bannerImage from "@/public/landing/home/banner.png";
import Image from "next/image";

export default function Banner() {
  return (
    <section className="relative min-h-96 md:min-h-[80vh] flex items-center text-white overflow-hidden bg-cover bg-center bg-no-repeat">
      <Image
        src={bannerImage}
        alt="Banner background"
        fill
        priority
        sizes="100vw"
        className="md:object-cover"
      />
      {/* Overlay – makes text readable */}
      <div className="absolute inset-0 bg-black/35" />
    </section>
  );
}
