"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { SuggestedSlot } from "@/data/mock/customer-portal";
import { formatLongDate } from "@/lib/formatters";
import type { QuoteStatus } from "@/types/domain";

interface QuoteActionPanelProps {
  initialStatus: QuoteStatus;
  title: string;
  slots: SuggestedSlot[];
}

export function QuoteActionPanel({
  initialStatus,
  title,
  slots,
}: QuoteActionPanelProps) {
  const [quoteStatus, setQuoteStatus] = useState(initialStatus);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(slots[0]?.date ?? "");
  const [selectedWindow, setSelectedWindow] = useState(slots[0]?.windows[0] ?? "");
  const [confirmedWindow, setConfirmedWindow] = useState<string | null>(null);

  const activeWindows = useMemo(
    () => slots.find((slot) => slot.date === selectedDate)?.windows ?? [],
    [selectedDate, slots],
  );

  function handleAccept() {
    setQuoteStatus("accepted");
    setShowSchedule(true);
  }

  function handleDecline() {
    setQuoteStatus("declined");
    setShowSchedule(false);
    setConfirmedWindow(null);
  }

  function handleConfirmSchedule() {
    if (!selectedDate || !selectedWindow) return;
    setConfirmedWindow(`${formatLongDate(selectedDate)} - ${selectedWindow}`);
    setShowSchedule(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/60 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
            Quote Actions
          </p>
          <p className="mt-1 text-sm text-gray-700">
            This prototype keeps quote approval and scheduling inside the customer dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-teal-700 text-white hover:bg-teal-800"
            onClick={handleAccept}
            type="button"
          >
            <CheckCircle2 size={18} />
            Accept Quote
          </Button>
          <Button onClick={handleDecline} type="button" variant="outline">
            <XCircle size={18} />
            Reject Quote
          </Button>
        </div>
      </div>

      {quoteStatus === "accepted" ? (
        <div className="rounded-xl border border-teal-200 bg-white p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">{title} approved</p>
          <p className="mt-1">
            Choose an appointment window to move the request into the scheduled stage.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setShowSchedule(true)} type="button">
              <CalendarDays size={18} />
              Schedule Appointment
            </Button>
            {confirmedWindow ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-emerald-800">
                <Clock3 size={16} />
                {confirmedWindow}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {quoteStatus === "declined" ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">
          Quote marked as declined in the prototype. A follow-up path can later connect this state to backend messaging.
        </div>
      ) : null}

      {showSchedule ? (
        <Modal
          className="mx-auto max-w-2xl"
          description="Select an appointment date and arrival window."
          onClose={() => setShowSchedule(false)}
          title="Schedule appointment"
        >
          <div className="rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                  Scheduling
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                  Choose your preferred visit window
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  Suggested times are based on the current technician availability for this request.
                </p>
              </div>

              <button
                aria-label="Close scheduling dialog"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setShowSchedule(false)}
                type="button"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900">Available dates</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {slots.map((slot) => (
                    <button
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        selectedDate === slot.date
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-gray-200 bg-white text-gray-800 hover:border-teal-300"
                      }`}
                      key={slot.date}
                      onClick={() => {
                        setSelectedDate(slot.date);
                        setSelectedWindow(slot.windows[0] ?? "");
                      }}
                      type="button"
                    >
                      <p className="text-sm font-semibold">{formatLongDate(slot.date)}</p>
                      <p className="mt-1 text-xs opacity-80">
                        {slot.windows.length} arrival windows available
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900">Arrival windows</p>
                <div className="space-y-2">
                  {activeWindows.map((windowLabel) => (
                    <button
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        selectedWindow === windowLabel
                          ? "border-teal-700 bg-teal-50 text-teal-800"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                      key={windowLabel}
                      onClick={() => setSelectedWindow(windowLabel)}
                      type="button"
                    >
                      <span>{windowLabel}</span>
                      {selectedWindow === windowLabel ? (
                        <CheckCircle2 size={16} />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setShowSchedule(false)} type="button" variant="outline">
                Cancel
              </Button>
              <Button onClick={handleConfirmSchedule} type="button">
                Confirm Window
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
