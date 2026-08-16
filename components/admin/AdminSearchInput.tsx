"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  ariaLabel?: string;
  name?: string;
  disabled?: boolean;
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
  ariaLabel,
  name,
  disabled,
}: AdminSearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400"
      />
      <Input
        name={name}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel ?? placeholder}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cn("h-12 pl-11 pr-4", inputClassName)}
      />
    </div>
  );
}
