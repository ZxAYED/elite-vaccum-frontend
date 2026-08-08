import Link from "next/link";
import { ArrowRight, Calendar, ClipboardList, FileText, Wrench } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import {
  getServiceById,
  getServiceDetailByRequestId,
  mockCustomerServiceRequests,
} from "@/data/mock/customer-portal";
import { formatMonthDay, formatShortDateTime } from "@/lib/formatters";

export default function UserServicesPage() {
  const groupedCounts = {
    all: mockCustomerServiceRequests.length,
    quoted: mockCustomerServiceRequests.filter((request) => request.status === "quoted")
      .length,
    scheduled: mockCustomerServiceRequests.filter(
      (request) => request.status === "scheduled",
    ).length,
    completed: mockCustomerServiceRequests.filter(
      (request) => request.status === "completed",
    ).length,
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/contact">Need help?</Link>
            </Button>
            <Button asChild>
              <Link href="/services">
                <Wrench size={18} />
                Start new request
              </Link>
            </Button>
          </>
        }
        description="Service requests are tracked separately from store purchases, with dedicated states for quotes, scheduling, and completion."
        eyebrow="Services"
        title="My Service Requests"
      />

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">All requests</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{groupedCounts.all}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm text-amber-700">Pending review</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{groupedCounts.quoted}</p>
        </div>
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 shadow-sm">
          <p className="text-sm text-teal-700">Scheduled</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {groupedCounts.scheduled}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-700">Completed</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {groupedCounts.completed}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {mockCustomerServiceRequests.map((request) => {
          const service = getServiceById(request.serviceId);
          const detail = getServiceDetailByRequestId(request.id);

          return (
            <div
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              key={request.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-gray-900">{request.title}</h2>
                    <StatusBadge status={request.status} />
                    <StatusBadge label={request.urgency} status={request.urgency} />
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-gray-600">
                    {request.description}
                  </p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <ClipboardList size={16} />
                        Request ID
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">{request.id}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Calendar size={16} />
                        Preferred visit
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">
                        {formatMonthDay(request.preferredDate)} at {request.preferredTime}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <FileText size={16} />
                        Service type
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">
                        {service?.name ?? "Service request"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-2xl border border-teal-100 bg-teal-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                    Next step
                  </p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">
                    {detail?.quote
                      ? `Review quote by ${formatMonthDay(detail.quote.expiresAt)}`
                      : detail?.appointment
                        ? `Appointment confirmed for ${formatShortDateTime(detail.appointment.startAt)}`
                        : detail?.completionSummary
                          ? "Leave a service review"
                          : "Awaiting operations review"}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {detail?.appointment?.technicianNote ??
                      detail?.quote?.notes ??
                      detail?.completionSummary?.followUp ??
                      "We will notify you as soon as the next status update is available."}
                  </p>
                  <Button asChild className="mt-5 w-full">
                    <Link href={`/user/services/${request.id}`}>
                      Open workflow
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
