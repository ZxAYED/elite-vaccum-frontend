"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CalendarProps {
  selected?: Date | string | null;
  onSelect?: (date: Date | null) => void;
  minDate?: Date | string;
  maxDate?: Date | string;
  className?: string;
}

const MONTH_NAMES = [
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

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseDateInput(value?: Date | string | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  // If string in "YYYY-MM-DD"
  const parts = value.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function Calendar({
  selected,
  onSelect,
  minDate,
  maxDate,
  className,
}: CalendarProps) {
  const selectedDate = parseDateInput(selected);
  const minParsed = parseDateInput(minDate);
  const maxParsed = parseDateInput(maxDate);

  const initialViewDate = selectedDate ?? minParsed ?? new Date();
  const [viewDate, setViewDate] = React.useState<Date>(
    new Date(initialViewDate.getFullYear(), initialViewDate.getMonth(), 1),
  );

  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [selectedDate]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Generate calendar days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Days from previous month
  const prevMonthDaysCount = new Date(viewYear, viewMonth, 0).getDate();
  const prevDays = Array.from({ length: firstDayIndex }, (_, i) => {
    const dayNum = prevMonthDaysCount - firstDayIndex + i + 1;
    const date = new Date(viewYear, viewMonth - 1, dayNum);
    return { date, isCurrentMonth: false, dayNum };
  });

  // Current month days
  const currentDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const date = new Date(viewYear, viewMonth, dayNum);
    return { date, isCurrentMonth: true, dayNum };
  });

  // Next month days to pad to 35 or 42 grid cells
  const totalShown = prevDays.length + currentDays.length;
  const nextDaysCount = totalShown <= 35 ? 35 - totalShown : 42 - totalShown;
  const nextDays = Array.from({ length: nextDaysCount }, (_, i) => {
    const dayNum = i + 1;
    const date = new Date(viewYear, viewMonth + 1, dayNum);
    return { date, isCurrentMonth: false, dayNum };
  });

  const allCalendarDays = [...prevDays, ...currentDays, ...nextDays];
  const today = new Date();

  return (
    <div className={cn("w-[280px] select-none p-2", className)}>
      {/* Month & Year Header */}
      <div className="flex items-center justify-between px-1 pb-3 pt-1">
        <span className="text-sm font-bold text-slate-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {WEEKDAY_NAMES.map((day) => (
          <span
            key={day}
            className="text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {allCalendarDays.map(({ date, isCurrentMonth, dayNum }, idx) => {
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, today);

          let isDisabled = false;
          if (minParsed) {
            const minBoundary = new Date(
              minParsed.getFullYear(),
              minParsed.getMonth(),
              minParsed.getDate(),
            );
            if (date < minBoundary) isDisabled = true;
          }
          if (maxParsed) {
            const maxBoundary = new Date(
              maxParsed.getFullYear(),
              maxParsed.getMonth(),
              maxParsed.getDate(),
            );
            if (date > maxBoundary) isDisabled = true;
          }

          return (
            <button
              key={`${date.toISOString()}-${idx}`}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled && onSelect) {
                  onSelect(date);
                }
              }}
              className={cn(
                "relative flex size-9 items-center justify-center rounded-xl text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                !isCurrentMonth && "text-slate-300",
                isCurrentMonth && !isSelected && !isDisabled && "text-slate-700 hover:bg-teal-50 hover:text-primary",
                isToday && !isSelected && "font-bold text-primary ring-1 ring-teal-300",
                isSelected && "bg-primary font-bold text-white shadow-sm hover:bg-teal-900",
                isDisabled && "cursor-not-allowed text-slate-200 hover:bg-transparent",
              )}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {/* Quick Footer Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 px-1 pt-2">
        <button
          type="button"
          onClick={() => onSelect?.(null)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            let isDisabled = false;
            if (minParsed) {
              const minBoundary = new Date(
                minParsed.getFullYear(),
                minParsed.getMonth(),
                minParsed.getDate(),
              );
              if (now < minBoundary) isDisabled = true;
            }
            if (!isDisabled && onSelect) {
              onSelect(now);
              setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
            }
          }}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  );
}
