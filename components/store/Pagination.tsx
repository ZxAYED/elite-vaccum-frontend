"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

import { Pressable } from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, "...", totalPages - 1, totalPages] as const;
  }

  if (currentPage >= totalPages - 3) {
    return [1, 2, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages] as const;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalItems <= pageSize || totalPages <= 1) {
    return null;
  }

  const pageItems = getPaginationItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Product pagination"
      className={cn(
        "mt-12 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm",
        className,
      )}
    >
      <Pressable className="justify-self-start">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="text-primary"
        >
          <ArrowLeft size={16} />
          Previous
        </Button>
      </Pressable>

      <div className="flex items-center justify-center gap-2">
        {pageItems.map((item, index) =>
          item === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="flex size-9 items-center justify-center text-slate-300"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Go to page ${item}`}
              aria-current={item === currentPage ? "page" : undefined}
              onClick={() => onPageChange(item)}
              className={cn(
                "flex size-9 items-center justify-center rounded-[0.8rem] text-sm font-medium text-slate-400 transition hover:bg-[var(--brand-soft)] hover:text-primary",
                item === currentPage && "bg-[#d8eeee] text-primary",
              )}
            >
              {item}
            </button>
          ),
        )}
      </div>

      <Pressable className="justify-self-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="text-primary"
        >
          Next
          <ArrowRight size={16} />
        </Button>
      </Pressable>
    </nav>
  );
}
