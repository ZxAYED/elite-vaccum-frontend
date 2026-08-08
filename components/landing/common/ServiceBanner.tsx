import bannerImage from "@/public/landing/service/service.png";
import Image from "next/image";

export default function ServiceBanner() {
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
      <div className="absolute inset-0 bg-black/15" />
      <section className="bg-linear-to-br from-primary to-primary/80 text-primary-foreground py-16 md:py-24 absolute inset-0">
        <div className="max-w-360 mx-auto px-4">
          <div className="inline-block  text-[#BCFF56] px-4 py-2 rounded-full text-lg font-medium ">
            OUR EXPERTISE
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-semibold mb-6 text-white">
            Services & <br /> Solutions.
          </h1>
          <p className="text-xl  max-w-2xl text-white">
            From emergency repairs to sophisticated hospital-grade
            installations, we provide the ultimate cleaning infrastructure for
            your property.
          </p>
        </div>
      </section>
    </section>
  );
}
