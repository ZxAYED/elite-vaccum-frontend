import type { ReactNode } from "react";

import { MotionSection } from "@/components/motion/MotionSection";

interface LegalSection {
  title: string;
  body: ReactNode;
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
}

export function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: LegalPageProps) {
  return (
    <main className="bg-[var(--background)]">
      <MotionSection className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          {description}
        </p>
      </MotionSection>

      <MotionSection className="mx-auto max-w-5xl px-4 pb-20 md:pb-28">
        <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[0_24px_70px_-54px_rgba(28,79,80,0.52)] ring-1 ring-teal-100 md:p-10">
          <div className="space-y-10">
            {sections.map((section) => (
              <section
                className="border-b border-teal-100 pb-8 last:border-b-0 last:pb-0"
                key={section.title}
              >
                <h2 className="text-2xl font-semibold text-primary">
                  {section.title}
                </h2>
                <div className="mt-4 text-base leading-8 text-slate-600">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </MotionSection>
    </main>
  );
}
