"use client";

import { Calendar, Clock, Download, MapPin } from "lucide-react";

import { formatLongDate } from "@/lib/formatters";

import type { AddressChoice, InstallationType } from "./types";

const addressLookup: Record<AddressChoice, string> = {
  primary: "123 Heritage Lane, Greenwich, CT 06830",
  project: "45 Orchard View, Scarsdale, NY 10583",
};

function getInstallationLabel(installType: InstallationType) {
  return installType === "system"
    ? "Central Vacuum Installation"
    : "Accessory & Upgrade Fit";
}

export default function StepFour({
  installType,
  onConfirm,
  selectedAddress,
  selectedDate,
  selectedTime,
}: {
  installType: InstallationType;
  onConfirm: () => void;
  selectedAddress: AddressChoice;
  selectedDate: number;
  selectedTime: string;
}) {
  const previewDate = new Date();
  previewDate.setDate(selectedDate);

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <h2 className="mb-1 text-[22px] font-extrabold text-slate-950">
        Review Request Draft
      </h2>
      <p className="mb-5 text-[14px] text-slate-600">
        This is a local preview of the service request. It will not dispatch a
        technician or create an invoice yet.
      </p>

      <div className="mb-5 flex items-center justify-between rounded-[var(--radius-card)] bg-primary px-5 py-4 text-white">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-widest text-white/65">
            PREFERRED VISIT WINDOW
          </p>
          <p className="text-[18px] font-extrabold">
            {formatLongDate(previewDate)} at {selectedTime}
          </p>
        </div>
        <Calendar aria-hidden="true" className="text-white/70" size={22} />
      </div>

      <div className="mb-4 rounded-[var(--radius-card)] border border-[var(--border)] px-5 py-4">
        <p className="mb-3 text-[12px] font-bold text-slate-400">
          REQUEST PREVIEW
        </p>

        <div className="mb-4 flex items-start gap-2.5">
          <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-slate-500" size={15} />
          <div>
            <p className="mb-0.5 text-[11px] font-semibold tracking-widest text-slate-400">
              ADDRESS
            </p>
            <p className="text-[14px] text-slate-950">
              {addressLookup[selectedAddress]}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Clock aria-hidden="true" className="mt-0.5 shrink-0 text-slate-500" size={15} />
          <div>
            <p className="mb-0.5 text-[11px] font-semibold tracking-widest text-slate-400">
              SERVICE REQUESTED
            </p>
            <p className="text-[14px] font-bold text-slate-950">
              {getInstallationLabel(installType)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-[13px] font-semibold text-slate-700">
          Demo Work Order
        </p>

        <div className="mb-2 rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3.5">
          <div className="mb-3 flex justify-between">
            <p className="text-[18px] font-extrabold text-slate-950">
              Local Preview
            </p>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Preview ID</p>
              <p className="text-[13px] font-bold">DEMO-2026-001</p>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <div>
              <p className="text-[11px] text-slate-400">Prepared For</p>
              <p className="text-[13px] font-bold">Future backend submission</p>
              <p className="text-[11px] text-slate-400">
                Live request creation is not enabled yet.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Prepared On</p>
              <p className="text-[12px] font-semibold">August 7, 2026</p>
              <p className="mt-1 text-[10px] text-slate-400">Dispatch Status</p>
              <p className="text-[12px] font-semibold">Not Submitted</p>
            </div>
          </div>
        </div>

        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] bg-slate-100 py-2.5 text-[13px] font-semibold text-slate-700"
          type="button"
        >
          <Download aria-hidden="true" size={14} /> Download Preview
        </button>
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <button
          className="mb-2 w-full rounded-[var(--radius-control)] bg-primary py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
          onClick={onConfirm}
          type="button"
        >
          Save Local Draft
        </button>
        <p className="text-center text-[12px] font-semibold tracking-widest text-slate-400">
          BACKEND SUBMISSION COMES NEXT
        </p>
      </div>
    </div>
  );
}
