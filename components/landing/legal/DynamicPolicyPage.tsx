"use client";

import type { ReactNode } from "react";
import { MotionSection } from "@/components/motion/MotionSection";
import { useGetPolicyBySlugQuery } from "@/redux/api/settingsApi";
import { formatLongDate } from "@/lib/formatters";
import { ShieldCheck, Calendar, FileText } from "lucide-react";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

interface DynamicPolicyPageProps {
  slug: string;
  defaultEyebrow: string;
  defaultTitle: string;
  defaultDescription: string;
  fallbackSections: LegalSection[];
}

export function DynamicPolicyPage({
  slug,
  defaultEyebrow,
  defaultTitle,
  defaultDescription,
  fallbackSections,
}: DynamicPolicyPageProps) {
  const { data: policy, isLoading } = useGetPolicyBySlugQuery(slug);

  const title = policy?.title || defaultTitle;
  const eyebrow = defaultEyebrow;
  const description = defaultDescription;

  // Split raw text content into paragraphs/sections if no HTML is provided
  const parsedSections = parsePolicyContent(policy?.content || policy?.contentMarkdown);

  const effectiveDate =
    policy?.effectiveDate || policy?.updatedAt || policy?.lastUpdated;

  return (
    <main className="bg-[var(--background)]">
      {/* Header Banner */}
      <MotionSection className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            <span>{eyebrow}</span>
            {policy?.version ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-teal-900">
                <FileText size={12} />
                v{policy.version}
              </span>
            ) : null}
            {effectiveDate ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-normal tracking-normal text-slate-600">
                <Calendar size={12} />
                Updated {formatLongDate(effectiveDate)}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-primary md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            {description}
          </p>
        </div>
      </MotionSection>

      {/* Main Body */}
      <MotionSection className="mx-auto max-w-[1400px] px-4 pb-20 sm:px-6 md:pb-28 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[var(--radius-card)] bg-white p-6 shadow-[0_24px_70px_-54px_rgba(28,79,80,0.52)] ring-1 ring-teal-100 md:p-10">
          {isLoading ? (
            <div className="space-y-8 animate-pulse">
              <div className="h-6 w-1/3 rounded bg-slate-200" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
                <div className="h-4 w-4/6 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-1/4 rounded bg-slate-200" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-5/6 rounded bg-slate-100" />
              </div>
            </div>
          ) : policy?.contentHtml ? (
            <article
              className="prose prose-teal max-w-none text-base leading-8 text-slate-600 prose-headings:font-semibold prose-headings:text-primary prose-a:text-teal-700 hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: policy.contentHtml }}
            />
          ) : parsedSections.length > 0 ? (
            <div className="space-y-10">
              {parsedSections.map((section, idx) => (
                <section
                  className="border-b border-teal-100 pb-8 last:border-b-0 last:pb-0"
                  key={section.title || idx}
                >
                  {section.title ? (
                    <h2 className="text-2xl font-semibold text-primary">
                      {section.title}
                    </h2>
                  ) : null}
                  <div className="mt-4 space-y-4 text-base leading-8 text-slate-600">
                    {section.paragraphs.map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Fallback to local default structured sections */
            <div className="space-y-10">
              {fallbackSections.map((section) => (
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
          )}

          {/* Verification Badge */}
          <div className="mt-12 flex items-center gap-3 rounded-2xl bg-teal-50/70 p-4 ring-1 ring-teal-100">
            <ShieldCheck className="size-5 shrink-0 text-teal-700" />
            <p className="text-xs text-slate-600">
              Elite Central Vacuum Legal and Compliance Documentation. For inquiries or clarification, contact our legal team at{" "}
              <a
                href="mailto:zzayediqbalofficial@gmail.com"
                className="font-medium text-teal-800 underline underline-offset-2"
              >
                zzayediqbalofficial@gmail.com
              </a>.
            </p>
          </div>
        </div>
      </MotionSection>
    </main>
  );
}

/** Helper to parse markdown or double-newline separated policy strings into titled sections */
function parsePolicyContent(raw?: string): Array<{ title?: string; paragraphs: string[] }> {
  if (!raw || !raw.trim()) return [];

  const lines = raw.split(/\n\n+/).map((l) => l.trim()).filter(Boolean);
  const sections: Array<{ title?: string; paragraphs: string[] }> = [];

  let currentSection: { title?: string; paragraphs: string[] } = { paragraphs: [] };

  for (const block of lines) {
    // Check if block starts with markdown heading or is a short header
    if (block.startsWith("#")) {
      if (currentSection.title || currentSection.paragraphs.length) {
        sections.push(currentSection);
      }
      const titleText = block.replace(/^#+\s*/, "");
      currentSection = { title: titleText, paragraphs: [] };
    } else if (block.length < 50 && !block.includes(".") && !block.includes(":")) {
      if (currentSection.title || currentSection.paragraphs.length) {
        sections.push(currentSection);
      }
      currentSection = { title: block, paragraphs: [] };
    } else {
      currentSection.paragraphs.push(block);
    }
  }

  if (currentSection.title || currentSection.paragraphs.length) {
    sections.push(currentSection);
  }

  return sections;
}
