import { cn } from "@/lib/utils";

interface TypeBadgeProps {
  type: "PRODUCT" | "SERVICE";
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const isService = type === "SERVICE";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-[0.16em]",
        isService ? "bg-teal-100 text-teal-800" : "bg-sky-100 text-sky-800",
        className,
      )}
    >
      {type}
    </span>
  );
}
