"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ServiceSummary } from "./ServiceSummary";
import type { InstallationType } from "./types";

const timeSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:30 PM"] as const;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: { day: number; current: boolean }[] = [];

  for (let index = firstDay - 1; index >= 0; index -= 1) {
    cells.push({ day: daysInPrevMonth - index, current: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, current: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      day: cells.length - daysInMonth - firstDay + 1,
      current: false,
    });
  }

  return cells;
}

export default function StepThree({
  installType,
  onNext,
  onSelectDate,
  onSelectTime,
  selectedDate,
  selectedTime,
}: {
  installType: InstallationType;
  onNext: () => void;
  onSelectDate: (date: number) => void;
  onSelectTime: (time: string) => void;
  selectedDate: number;
  selectedTime: string;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const cells = buildCalendar(viewYear, viewMonth);
  const isCurrentMonth =
    viewMonth === today.getMonth() && viewYear === today.getFullYear();

  function previousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((value) => value - 1);
      return;
    }

    setViewMonth((value) => value - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((value) => value + 1);
      return;
    }

    setViewMonth((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-start">
      <div className="flex-1">
        <h2 className="mb-1 text-[22px] font-extrabold text-slate-950">
          Preferred Visit Window
        </h2>
        <p className="mb-5 text-[14px] text-slate-600">
          Pick a date and time for the draft request preview.
        </p>

        <div className="mb-5 rounded-[var(--radius-card)] border border-[var(--border)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[14px] font-bold text-slate-950">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex gap-1">
              <button
                aria-label="View previous month"
                className="flex size-8 items-center justify-center rounded-md border border-[var(--border)] text-slate-700"
                onClick={previousMonth}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={14} />
              </button>
              <button
                aria-label="View next month"
                className="flex size-8 items-center justify-center rounded-md border border-[var(--border)] text-slate-700"
                onClick={nextMonth}
                type="button"
              >
                <ChevronRight aria-hidden="true" size={14} />
              </button>
            </div>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-[2px]">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label) => (
              <div
                className="py-1 text-center text-[11px] font-semibold text-slate-400"
                key={label}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-[2px]">
            {cells.map((cell, index) => {
              const disabled =
                !cell.current || (isCurrentMonth && cell.day < today.getDate());
              const active = selectedDate === cell.day && cell.current;

              return (
                <button
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-[13px] transition-[background-color,color] ${
                    disabled
                      ? "cursor-default text-slate-300"
                      : active
                        ? "bg-primary font-bold text-white"
                        : "text-slate-900 hover:bg-[var(--brand-soft)]"
                  }`}
                  disabled={disabled}
                  key={`${cell.day}-${index}`}
                  onClick={() => onSelectDate(cell.day)}
                  type="button"
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        <p className="mb-2 text-[14px] font-bold text-slate-950">
          Available Time Slots
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {timeSlots.map((slot) => {
            const active = selectedTime === slot;

            return (
              <button
                className={`rounded-2xl border py-[11px] text-[13px] font-semibold transition-[background-color,border-color,color] ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-[var(--border)] bg-slate-100 text-slate-700 hover:border-primary/40"
                }`}
                key={slot}
                onClick={() => onSelectTime(slot)}
                type="button"
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>

      <ServiceSummary
        ctaLabel="Continue"
        installType={installType}
        onCta={onNext}
        showContinueIcon
      />
    </div>
  );
}
