"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { Calendar } from "@/components/ui/Calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  minDate?: string | Date;
  maxDate?: string | Date;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  size?: "default" | "sm";
  align?: "start" | "center" | "end";
}

function formatDateString(isoOrDateStr?: string): string {
  if (!isoOrDateStr) return "";
  const parts = isoOrDateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  return isoOrDateStr;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date...",
  disabled,
  className,
  error,
  size = "default",
  align = "start",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | null) => {
    if (!date) {
      onChange?.("");
    } else {
      // Convert to YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange?.(`${year}-${month}-${day}`);
    }
    setOpen(false);
  };

  const formattedDisplay = formatDateString(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between text-left text-sm text-slate-800 shadow-none transition focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50",
            size === "sm"
              ? "h-9.5 rounded-xl border border-slate-200 bg-white px-3"
              : "h-12 rounded-2xl border border-teal-100 bg-slate-50 px-4",
            error && "border-rose-400 bg-rose-50/20 text-rose-900 focus-visible:ring-rose-400",
            className,
          )}
        >
          <span className={cn("truncate font-normal", !value && "text-slate-400")}>
            {value ? formattedDisplay : placeholder}
          </span>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-2">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange?.("");
                  }
                }}
                className="rounded-full p-0.5 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                aria-label="Clear date"
              >
                <X size={14} />
              </span>
            )}
            <CalendarIcon size={size === "sm" ? 15 : 17} className="text-teal-700" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[70] w-auto p-1.5 shadow-2xl rounded-2xl border border-teal-100 bg-white"
        align={align}
        sideOffset={6}
      >
        <Calendar
          selected={value}
          onSelect={handleSelect}
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
}
