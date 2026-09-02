import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, CreditCard, MapPin, UserRound, XCircle } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { Button } from "@/components/ui/Button";
import { getDashboardServiceOrderByRequestId } from "@/data/mock/customer-dashboard";
import { cn } from "@/lib/utils";

interface ScheduleDetailPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  const { requestId } = await params;
  const order = getDashboardServiceOrderByRequestId(requestId);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-md">
              <Link href="/user/schedule">Back to schedule</Link>
            </Button>
            <Button asChild size="sm" className="rounded-md bg-teal-600 hover:bg-teal-500 font-medium">
              <Link href={`/user/orders/${order.id}`}>View Service Order</Link>
            </Button>
          </div>
        }
        description={`Request ID: ${order.serviceRequestId}`}
        eyebrow="Service Schedule"
        title="Service Schedule Details"
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-5">Appointment Progress</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {order.timeline.map((step) => (
            <div className="text-center" key={step.key}>
              <div
                className={cn(
                  "mx-auto flex size-10 items-center justify-center rounded-full border-2",
                  step.complete
                    ? "border-teal-500 bg-teal-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-400",
                )}
              >
                <Check size={16} />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-900">{step.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-500 font-normal">{step.detail}</p>
              <p className="mt-1 text-[10px] text-slate-400 font-mono">{step.dateLabel}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <CalendarDays className="text-teal-700" size={18} />
            <h2 className="text-base font-bold text-slate-900">Appointment Details</h2>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Requested Schedule
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {order.requestedSchedule}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Confirmed Schedule
              </p>
              <p className="mt-1 font-semibold text-teal-950">{order.currentSchedule}</p>
            </div>
          </div>
          {order.technician ? (
            <div className="rounded-md border border-teal-200 bg-teal-50/60 p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                Assigned Technician
              </p>
              <p className="text-base font-bold text-slate-900">
                {order.technician.name}
              </p>
              <p className="text-xs text-slate-600 font-mono">{order.technician.phone}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserRound className="text-teal-700" size={18} />
            <h2 className="text-base font-bold text-slate-900">Service Overview</h2>
          </div>
          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Service Type
              </p>
              <p className="mt-0.5 font-semibold text-slate-900">{order.serviceName}</p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                Service Address
              </p>
              <p className="mt-0.5 font-medium text-slate-800 flex items-center gap-1.5">
                <MapPin className="text-teal-700 shrink-0" size={14} />
                {order.location.line1}, {order.location.city}
              </p>
            </div>
            <div className="rounded-md border border-teal-900/60 bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 p-4 text-white">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CreditCard size={15} />
                Payment Status
              </div>
              <p className="mt-1 text-xs text-teal-100/80 font-normal">
                Billing connected through invoice {order.invoiceId}.
              </p>
            </div>
            {order.customerNotes ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Notes:</span> {order.customerNotes}
              </div>
            ) : null}
            <div className="pt-2 text-center">
              <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700">
                <XCircle size={14} />
                Cancel Service Request
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
