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
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/user/schedule">Back to schedule</Link>
            </Button>
            <Button asChild>
              <Link href={`/user/orders/${order.id}`}>View Service Order</Link>
            </Button>
          </>
        }
        description={`Request ID: ${order.serviceRequestId}`}
        eyebrow="Service Schedule"
        title="Service Schedule"
      />

      <div className="mb-10 grid gap-5 md:grid-cols-4">
        {order.timeline.map((step) => (
          <div className="text-center" key={step.key}>
            <div
              className={cn(
                "mx-auto flex size-12 items-center justify-center rounded-full border-4",
                step.complete
                  ? "border-teal-100 bg-primary text-white"
                  : "border-gray-100 bg-gray-50 text-gray-400",
              )}
            >
              <Check size={18} />
            </div>
            <h2 className="mt-3 font-semibold text-gray-900">{step.label}</h2>
            <p className="mt-1 text-sm text-gray-600">{step.detail}</p>
            <p className="mt-2 text-xs text-gray-400">{step.dateLabel}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-teal-700" size={22} />
            <h2 className="text-xl font-semibold text-primary">Appointment Details</h2>
          </div>
          <div className="mt-5 grid gap-4 rounded-2xl bg-gray-50 p-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Requested
              </p>
              <p className="mt-2 font-semibold text-primary">
                {order.requestedSchedule}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Current
              </p>
              <p className="mt-2 font-semibold text-primary">{order.currentSchedule}</p>
            </div>
          </div>
          {order.technician ? (
            <div className="mt-5 rounded-2xl bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Technician
              </p>
              <p className="mt-2 text-xl font-semibold text-primary">
                {order.technician.name}
              </p>
              <p className="text-sm text-gray-600">{order.technician.phone}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="text-teal-700" size={22} />
            <h2 className="text-xl font-semibold text-primary">Service Overview</h2>
          </div>
          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Service Type
              </p>
              <p className="mt-2 text-gray-700">{order.serviceName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                Address
              </p>
              <p className="mt-2 text-gray-700">
                <MapPin className="mr-2 inline text-teal-700" size={16} />
                {order.location.line1}, {order.location.city}
              </p>
            </div>
            <div className="rounded-2xl bg-primary p-5 text-white">
              <CreditCard size={18} />
              <p className="mt-2 font-semibold">Payment Status</p>
              <p className="mt-1 text-sm text-white/75">
                Billing is connected through invoice {order.invoiceId}.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
              {order.customerNotes}
            </div>
            <button className="mx-auto flex items-center gap-2 text-sm font-semibold text-red-600">
              <XCircle size={16} />
              Cancel Request
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
