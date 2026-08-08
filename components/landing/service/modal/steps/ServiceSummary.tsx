"use client";

import { ArrowRight, ChevronRight, ShieldCheck } from "lucide-react";

import type { InstallationType } from "./types";

function getInstallationLabel(installType: InstallationType) {
  return installType === "system"
    ? "Central Vacuum Installation"
    : "Accessory & Upgrade Fit";
}

export function ServiceSummary({
  ctaLabel = "Next Step",
  installType,
  onCta,
  showContinueIcon = false,
}: {
  ctaLabel?: string;
  installType: InstallationType;
  onCta: () => void;
  showContinueIcon?: boolean;
}) {
  return (
    <div className="w-full md:min-w-[240px] md:max-w-[280px]">
      <div className="mb-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="mb-4 text-[15px] font-bold text-slate-950">
          Request Summary
        </p>

        <div className="mb-2 flex justify-between gap-4">
          <span className="text-[13px] text-slate-500">Service Type</span>
          <span className="text-right text-[13px] font-semibold text-slate-950">
            Installation Planning
          </span>
        </div>

        <div className="mb-4 flex justify-between gap-4">
          <span className="text-[13px] text-slate-500">Request Focus</span>
          <span className="text-right text-[13px] font-semibold text-slate-950">
            {getInstallationLabel(installType)}
          </span>
        </div>

        <p className="mb-4 text-[12px] font-bold tracking-widest text-primary">
          FRONTEND PREVIEW ONLY
        </p>

        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--brand-soft)] px-3 py-3">
          <ShieldCheck aria-hidden="true" className="text-primary" size={16} />
          <div>
            <p className="text-[12px] font-bold text-slate-950">
              BACKEND SUBMISSION COMES NEXT
            </p>
            <p className="text-[11px] text-slate-600">
              This flow validates choices and previews the request only.
            </p>
          </div>
        </div>
      </div>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary px-5 py-[13px] text-[15px] font-bold text-white transition-opacity hover:opacity-90"
        onClick={onCta}
        type="button"
      >
        {ctaLabel}
        {showContinueIcon ? (
          <ArrowRight aria-hidden="true" size={16} />
        ) : (
          <ChevronRight aria-hidden="true" size={16} />
        )}
      </button>
    </div>
  );
}
