"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { inputClassName } from "@/components/forms/formStyles";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        className={cn(inputClassName, "pr-12", className)}
        type={isVisible ? "text" : "password"}
      />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
        onClick={() => setIsVisible((current) => !current)}
        type="button"
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
