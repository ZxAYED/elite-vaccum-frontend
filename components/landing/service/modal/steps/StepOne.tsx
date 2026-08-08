"use client";

import { Settings, Sparkles, Upload } from "lucide-react";

import { ServiceSummary } from "./ServiceSummary";
import type { InstallationType } from "./types";

const installOptions = [
  {
    id: "system" as const,
    icon: Sparkles,
    title: "New System Installation",
    description:
      "Power-unit planning, inlet placement review, and startup preparation for a full central vacuum system.",
  },
  {
    id: "accessories" as const,
    icon: Settings,
    title: "Accessory & Upgrade Fit",
    description:
      "Hose, wand, tool, or upgrade compatibility guidance for an existing central vacuum setup.",
  },
];

export default function StepOne({
  onNext,
  onSelect,
  selected,
}: {
  onNext: () => void;
  onSelect: (id: InstallationType) => void;
  selected: InstallationType;
}) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <div className="flex-1">
        <h2 className="mb-1 text-[22px] font-extrabold text-slate-950">
          What do you want to plan today?
        </h2>
        <p className="mb-6 text-[14px] text-slate-600">
          Choose the type of service request draft you want to prepare.
        </p>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {installOptions.map(({ description, icon: Icon, id, title }) => {
            const active = selected === id;

            return (
              <button
                className={`rounded-[var(--radius-card)] border p-4 text-left transition-[background-color,border-color] ${
                  active
                    ? "border-primary bg-[var(--brand-soft)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)] hover:border-primary/40"
                }`}
                key={id}
                onClick={() => onSelect(id)}
                type="button"
              >
                <div
                  className={`mb-2 flex size-10 items-center justify-center rounded-2xl ${
                    active ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  <Icon aria-hidden="true" size={18} />
                </div>

                <p className="mb-1 text-[14px] font-bold text-slate-950">
                  {title}
                </p>
                <p className="text-[12px] leading-relaxed text-slate-600">
                  {description}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mb-2 text-[13px] font-semibold text-slate-700">Optional</p>

        <div className="flex flex-col items-center gap-1 rounded-[var(--radius-card)] border border-dashed border-primary/30 bg-[var(--brand-soft)] px-6 py-6 text-center">
          <Upload aria-hidden="true" className="text-primary" size={22} />
          <p className="text-[14px] font-semibold text-slate-800">
            Upload photos or spec sheets later
          </p>
          <p className="text-[12px] text-slate-500">
            File attachments will connect to the backend upload flow in a future
            pass.
          </p>
        </div>
      </div>

      <ServiceSummary installType={selected} onCta={onNext} />
    </div>
  );
}
