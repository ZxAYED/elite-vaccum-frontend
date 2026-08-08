import bannerImage from "@/public/landing/contact/contact.png";
import Image from "next/image";

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
          <div className="inline-block  text-[#BCFF56] px-4 py-2 rounded-full text-lg font-medium ">
            CALL & CHATS
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-semibold mb-6 text-white">
            Contact Us
          </h1>
          <p className="text-xl text-white max-w-2xl ">
            We are here to help you anytime. Choose your preferred way to reach
            our specialists.
          </p>
        </div>
      </section>
    </section>
  );
}
