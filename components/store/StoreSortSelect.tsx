"use client";

import { ArrowDownWideNarrow } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/Select";

export const storeSortOptions = [
  { value: "popularity", label: "Popularity" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
] as const;

interface StoreSortSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function StoreSortSelect({
  value,
  onValueChange,
}: StoreSortSelectProps) {
  const selectedLabel =
    storeSortOptions.find((option) => option.value === value)?.label ?? "Popularity";

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-12 min-w-[12rem] rounded-full bg-white pl-4 pr-3 text-sm shadow-[0_18px_36px_-34px_rgba(28,79,80,0.34)]">
        <span className="inline-flex items-center gap-2 truncate">
          <ArrowDownWideNarrow size={16} className="text-teal-700" />
          <span className="font-medium text-slate-700">{selectedLabel}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {storeSortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
