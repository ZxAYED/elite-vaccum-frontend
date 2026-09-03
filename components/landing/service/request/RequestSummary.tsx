import { CalendarDays, MapPin, Wrench } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface RequestSummaryProps {
  serviceTitle: string;
  requestedDate?: string;
  requestedTime?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  mediaCount: number;
  isSubmitting: boolean;
}

export function RequestSummary({
  serviceTitle,
  requestedDate,
  requestedTime,
  address,
  city,
  state,
  zipCode,
  mediaCount,
  isSubmitting,
}: RequestSummaryProps) {
  const location = [address, city, state, zipCode].filter(Boolean).join(", ");

  return (
    <aside className="w-full rounded-[1.35rem] border border-teal-800/30 bg-primary p-6 text-white shadow-sm lg:sticky lg:top-28">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-100">
        Review Request
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
        {serviceTitle}
      </h2>

      <div className="mt-6 space-y-4 text-sm">
        <div className="flex gap-3">
          <CalendarDays className="mt-0.5 shrink-0 text-teal-100" size={18} />
          <div>
            <p className="font-semibold">Requested schedule</p>
            <p className="mt-1 text-white/75">
              {requestedDate && requestedTime
                ? `${requestedDate} at ${requestedTime}`
                : "Choose a date and time"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <MapPin className="mt-0.5 shrink-0 text-teal-100" size={18} />
          <div>
            <p className="font-semibold">Service location</p>
            <p className="mt-1 text-white/75">
              {location || "Add the technician visit address"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Wrench className="mt-0.5 shrink-0 text-teal-100" size={18} />
          <div>
            <p className="font-semibold">Uploaded media</p>
            <p className="mt-1 text-white/75">
              {mediaCount} file{mediaCount === 1 ? "" : "s"} attached
            </p>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 w-full bg-white text-primary hover:bg-teal-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Service Request"}
      </Button>
      <p className="mt-4 text-xs leading-5 text-white/65">
        Our team may contact you if the appointment needs to be adjusted after
        review.
      </p>
    </aside>
  );
}
