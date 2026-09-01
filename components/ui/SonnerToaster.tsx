"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className:
          "!font-sans !rounded-2xl !border !border-teal-100 !bg-white/95 !backdrop-blur-md !text-slate-900 !shadow-[0_20px_45px_-15px_rgba(28,79,80,0.22)] !py-3.5 !px-4",
        classNames: {
          toast: "group toast",
          title: "!text-sm !font-semibold !text-slate-900",
          description: "!text-xs !text-slate-500 !mt-0.5",
          actionButton: "!bg-teal-700 !text-white !font-medium !rounded-xl !text-xs",
          cancelButton: "!bg-slate-100 !text-slate-600 !font-medium !rounded-xl !text-xs",
          closeButton: "!border-teal-200 !bg-white !text-slate-500 hover:!bg-slate-50",
          success: "!border-teal-200 !bg-teal-50/90 !text-teal-950",
          error: "!border-rose-200 !bg-rose-50/90 !text-rose-950",
          warning: "!border-amber-200 !bg-amber-50/90 !text-amber-950",
          info: "!border-sky-200 !bg-sky-50/90 !text-sky-950",
        },
      }}
    />
  );
}
