import { formatStatusLabel } from "@/lib/status-labels";
import { cn } from "@/lib/utils";

const toneByStatus: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border border-blue-200",
  "under-review": "bg-amber-50 text-amber-800 border border-amber-200",
  quoted: "bg-amber-50 text-amber-800 border border-amber-200",
  scheduled: "bg-purple-50 text-purple-800 border border-purple-200",
  "in-progress": "bg-indigo-50 text-indigo-800 border border-indigo-200",
  "report-submitted": "bg-cyan-50 text-cyan-800 border border-cyan-200",
  completed: "bg-teal-50 text-teal-800 border border-teal-200",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
  pending: "bg-amber-50 text-amber-800 border border-amber-200",
  published: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  hidden: "bg-slate-100 text-slate-700 border border-slate-200",
  paid: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  refunded: "bg-slate-100 text-slate-700 border border-slate-200",
  failed: "bg-rose-50 text-rose-700 border border-rose-200",
  processing: "bg-blue-50 text-blue-700 border border-blue-200",
  shipped: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  delivered: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  rescheduled: "bg-amber-50 text-amber-800 border border-amber-200",
  "technician-assigned": "bg-teal-50 text-teal-800 border border-teal-200",
  "on-the-way": "bg-indigo-50 text-indigo-800 border border-indigo-200",
  arrived: "bg-purple-50 text-purple-800 border border-purple-200",
  authorized: "bg-blue-50 text-blue-700 border border-blue-200",
  draft: "bg-slate-100 text-slate-700 border border-slate-200",
  sent: "bg-amber-50 text-amber-800 border border-amber-200",
  viewed: "bg-cyan-50 text-cyan-800 border border-cyan-200",
  accepted: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  expired: "bg-slate-100 text-slate-600 border border-slate-200",
  urgent: "bg-rose-50 text-rose-700 border border-rose-200",
  priority: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  normal: "bg-slate-100 text-slate-700 border border-slate-200",
  service: "bg-teal-50 text-teal-800 border border-teal-200",
  product: "bg-blue-50 text-blue-700 border border-blue-200",
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
        "inline-flex min-h-6 w-fit items-center justify-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-center text-xs font-semibold leading-none",
        toneByStatus[norm] ?? "bg-gray-100 text-gray-700 border border-gray-200",
        className,
      )}
    >
      {label ?? formatStatusLabel(status)}
    </span>
  );
}
