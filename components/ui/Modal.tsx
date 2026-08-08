"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Modal({
  title,
  description,
  onClose,
  children,
  className,
  overlayClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    requestAnimationFrame(() => {
      const focusable = panel?.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusable?.length) {
        focusable[0].focus();
        return;
      }
      panel?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 overscroll-contain",
        overlayClassName,
      )}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn("w-full touch-manipulation", className)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        tabIndex={-1}
      >
        <h2 className="sr-only" id={titleId}>
          {title}
        </h2>
        {description ? (
          <p className="sr-only" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
