import { formatStatusLabel } from "@/lib/status-labels";
import { cn } from "@/lib/utils";

const toneByStatus: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  "under-review": "bg-blue-100 text-blue-800",
  quoted: "bg-amber-100 text-amber-800",
  scheduled: "bg-teal-100 text-teal-800",
  "in-progress": "bg-indigo-100 text-indigo-800",
  "report-submitted": "bg-cyan-100 text-cyan-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-700",
  rejected: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  hidden: "bg-slate-200 text-slate-700",
  paid: "bg-emerald-100 text-emerald-800",
  refunded: "bg-slate-200 text-slate-700",
  failed: "bg-rose-100 text-rose-700",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  rescheduled: "bg-amber-100 text-amber-800",
  "technician-assigned": "bg-teal-100 text-teal-800",
  "on-the-way": "bg-indigo-100 text-indigo-800",
  arrived: "bg-purple-100 text-purple-800",
  authorized: "bg-blue-100 text-blue-800",
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-amber-100 text-amber-800",
  viewed: "bg-cyan-100 text-cyan-800",
  accepted: "bg-teal-100 text-teal-800",
  expired: "bg-slate-200 text-slate-700",
  urgent: "bg-rose-100 text-rose-700",
  priority: "bg-indigo-100 text-indigo-800",
  normal: "bg-slate-100 text-slate-700",
  service: "bg-teal-100 text-teal-800",
  product: "bg-blue-100 text-blue-800",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  className,
}: StatusBadgeProps) {
  const norm = (status || "").toLowerCase().replace(/_/g, "-");
  return (
    <span
      className={cn(
        "inline-flex min-h-7 w-fit items-center justify-center whitespace-nowrap rounded-xl px-3 py-1 text-center text-xs font-semibold leading-none",
        toneByStatus[norm] ?? "bg-gray-100 text-gray-700",
        className,
      )}
    >
      {label ?? formatStatusLabel(status)}
    </span>
  );
}
