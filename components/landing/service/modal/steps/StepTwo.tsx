"use client";

import { Briefcase, Home, Plus, ShieldCheck } from "lucide-react";

import { ServiceSummary } from "./ServiceSummary";
import type { AddressChoice, InstallationType } from "./types";

const addresses = [
  {
    id: "primary" as const,
    icon: Home,
    label: "Primary Residence",
    address: "123 Heritage Lane, Greenwich, CT 06830",
  },
  {
    id: "project" as const,
    icon: Briefcase,
    label: "Project Property",
    address: "45 Orchard View, Scarsdale, NY 10583",
  },
];

export default function StepTwo({
  installType,
  onNext,
  onSelect,
  selected,
}: {
  installType: InstallationType;
  onNext: () => void;
  onSelect: (id: AddressChoice) => void;
  selected: AddressChoice;
}) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <div className="flex-1">
        <h2 className="mb-1 text-[22px] font-extrabold text-slate-950">
          Service Address
        </h2>
        <p className="mb-6 text-[14px] text-slate-600">
          Choose where this draft request should be associated.
        </p>

        <div className="mb-3 flex flex-col gap-[10px]">
          {addresses.map(({ address, icon: Icon, id, label }) => {
            const active = selected === id;

            return (
              <button
                className={`flex items-center justify-between rounded-[var(--radius-card)] border px-4 py-[14px] text-left transition-[background-color,border-color,color] ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-[var(--border)] bg-[var(--surface)] text-slate-950 hover:border-primary/40"
                }`}
                key={id}
                onClick={() => onSelect(id)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className={active ? "text-white" : "text-slate-500"}
                    size={18}
                  />
                  <div>
                    <p className="text-[14px] font-bold">{label}</p>
                    <p
                      className={`text-[12px] ${
                        active ? "text-white/75" : "text-slate-500"
                      }`}
                    >
                      {address}
                    </p>
                  </div>
                </div>

                <div
                  className={`flex size-[18px] items-center justify-center rounded-full border-2 ${
                    active ? "border-white bg-white" : "border-slate-300"
                  }`}
                >
                  {active ? (
                    <div className="size-2 rounded-full bg-primary" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <button
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-card)] border border-dashed border-primary/30 bg-[var(--brand-soft)] py-[13px] text-[14px] font-semibold text-primary"
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Add Another Property Later
        </button>

        <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-slate-100 px-[14px] py-3">
          <ShieldCheck aria-hidden="true" className="text-slate-500" size={15} />
          <p className="text-[12px] text-slate-600">
            This step only stages the request locally. No technician is assigned
            until backend submission exists.
          </p>
        </div>
      </div>

      <ServiceSummary installType={installType} onCta={onNext} />
    </div>
  );
}
