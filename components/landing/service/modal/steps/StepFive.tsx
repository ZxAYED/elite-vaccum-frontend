"use client";

import { ClipboardCheck } from "lucide-react";

import { formatLongDate } from "@/lib/formatters";

export default function StepFive({
  onDashboard,
  selectedDate,
  selectedTime,
}: {
  onDashboard: () => void;
  selectedDate: number;
  selectedTime: string;
}) {
  const previewDate = new Date();
  previewDate.setDate(selectedDate);

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-5 flex size-[72px] items-center justify-center rounded-full bg-[var(--brand-soft)]">
        <ClipboardCheck aria-hidden="true" className="text-primary" size={32} />
      </div>

      <h2 className="mb-3 text-[32px] font-black leading-tight text-primary sm:text-[40px]">
        Request Draft Ready
      </h2>

      <p className="mb-6 max-w-[420px] text-[14px] leading-relaxed text-slate-600">
        Your local preview is staged for {formatLongDate(previewDate)} at{" "}
        {selectedTime}. A technician will not be dispatched until the service
        request backend is connected and this draft can be submitted for real.
      </p>

      <div className="mb-7 flex items-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-[13px] font-bold text-slate-700">
        <span className="inline-block size-2 rounded-full bg-amber-500" />
        STATUS: LOCAL PREVIEW ONLY
      </div>

      <button
        className="rounded-[var(--radius-control)] bg-primary px-8 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90"
        onClick={onDashboard}
        type="button"
      >
        Close Request Preview
      </button>
    </div>
  );
}
