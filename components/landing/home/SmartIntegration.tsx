import Image from "next/image";
import appStoreImage from "@/public/common/App Store.png";
import playStoreImage from "@/public/common/Play Store.png";
import mobileImage from "@/public/landing/home/mobileImage.png";
import { FadeIn } from "@/components/motion/Animated";

export default function SmartIntegration() {
  return (
    <section className="overflow-hidden bg-white py-16 md:py-20">
      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 rounded-[calc(var(--radius-card)+0.25rem)] border border-teal-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6fbfa_100%)] px-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:px-10 lg:py-10">
          <FadeIn className="space-y-8" x={-24} y={0} duration={0.65}>
            <div className="inline-flex rounded-full bg-teal-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Smart Integration
            </div>

            <h2 className="text-3xl font-bold tracking-[-0.03em] text-primary sm:text-4xl md:text-5xl">
              One-tap service booking
            </h2>

            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Elite Central Vacuum clients get exclusive access to our
              monitoring app. Track filter health, schedule service, and monitor
              system performance in real-time.
            </p>

            <div className="space-y-6">
              <h3 className="flex items-center gap-3 text-xl font-semibold text-primary sm:text-2xl">
                Download the App
              </h3>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://play.google.com/store/apps/details?id=com.elitecentralvacuum.app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={playStoreImage}
                    alt="Get it on Google Play"
                    width={140}
                    height={50}
                    className="h-10 w-auto"
                  />
                </a>

                <a
                  href="https://apps.apple.com/app/elit-central-vacuum"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={appStoreImage}
                    alt="Download on the App Store"
                    width={140}
                    height={50}
                    className="h-10 w-auto"
                  />
                </a>
              </div>
            </div>
          </FadeIn>

          <FadeIn
            className="relative mx-auto w-full max-w-sm"
            x={24}
            y={0}
            duration={0.7}
          >
            <div className="absolute inset-0 rounded-[calc(var(--radius-card)+0.5rem)] bg-teal-100/70 blur-3xl" />
            <Image
              src={mobileImage}
              alt="Elite Central Vacuum App dashboard with booking and system monitoring"
              width={1920}
              height={1681}
              sizes="(max-width: 1024px) 80vw, 28vw"
              className="relative h-auto w-full object-contain"
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
