"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Upload,
} from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { QuoteActionPanel } from "@/components/customer-portal/QuoteActionPanel";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getDashboardServiceOrderByRequestId } from "@/data/mock/customer-dashboard";
import {
  getServiceById,
  getServiceDetailByRequestId,
  getServiceRequestById,
  getTechnicianById,
} from "@/data/mock/customer-portal";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import {
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
  formatShortDateTime,
} from "@/lib/formatters";

export default function ServiceRequestDetailPage() {
  useSharedBusinessStoreVersion();
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const request = getServiceRequestById(requestId);
  const detail = getServiceDetailByRequestId(requestId);

  if (!request || !detail) {
    notFound();
  }

  const service = getServiceById(request.serviceId);
  const technician = getTechnicianById(
    detail.appointment?.technicianId ?? request.assignedTechnicianId,
  );
  const requestedSchedule =
    request.requestedSchedule?.label ??
    `${formatMonthDay(request.preferredDate)} at ${request.preferredTime}`;
  const currentSchedule =
    request.currentSchedule?.label ?? requestedSchedule;
  const serviceOrder = getDashboardServiceOrderByRequestId(request.id);

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/user/services">Back to requests</Link>
            </Button>
            <Button asChild>
              <Link href="/user/billing">View related billing</Link>
            </Button>
          </>
        }
        description={request.description}
        eyebrow={`Service Request ${request.id}`}
        title={request.title}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={request.status} />
              <StatusBadge label={request.urgency} status={request.urgency} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Requested schedule</p>
                <p className="mt-2 font-semibold text-gray-900">
                  {requestedSchedule}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Current schedule</p>
                <p className="mt-2 font-semibold text-gray-900">{currentSchedule}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Service type</p>
                <p className="mt-2 font-semibold text-gray-900">
                  {service?.name ?? request.title}
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Estimated amount</p>
                <p className="mt-2 font-semibold text-gray-900">
                  {request.estimatedAmountUsd
                    ? formatCurrencyUsd(request.estimatedAmountUsd)
                    : "Pending review"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <MapPin size={16} />
                  Service address
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {request.serviceAddress.line1}
                  <br />
                  {request.serviceAddress.city}, {request.serviceAddress.state}{" "}
                  {request.serviceAddress.postalCode}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <Upload size={16} />
                  Attachments
                </div>
                <div className="mt-3 space-y-2">
                  {request.attachments.length ? (
                    request.attachments.map((attachment) => (
                      <div
                        className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700"
                        key={attachment.id}
                      >
                        {attachment.fileName}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">
                      No additional files were attached to this request.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {request.equipment ? (
              <div className="mt-6 rounded-2xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-500">
                  Equipment information
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {[
                    ["Manufacturer", request.equipment.manufacturer],
                    ["Model", request.equipment.modelNumber],
                    ["Serial", request.equipment.serialNumber],
                    ["Unit location", request.equipment.unitLocation],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {value || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {request.rejectionHistory?.length ? (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-5">
                <p className="text-sm font-semibold text-rose-800">
                  Request rejection history
                </p>
                <div className="mt-3 space-y-2">
                  {request.rejectionHistory.map((entry) => (
                    <div key={entry.id} className="text-sm text-rose-800">
                      <span className="font-semibold">{entry.reason}</span>
                      {entry.comments ? ` - ${entry.comments}` : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
            <div className="mt-6 space-y-5">
              {detail.timeline.map((event) => (
                <div className="flex gap-4" key={event.id}>
                  <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                    <Clock3 size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{event.label}</h3>
                      <p className="text-sm text-gray-500">
                        {formatShortDateTime(event.occurredAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{event.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {detail.quote ? (
            <section
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              id="quote"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                    Quote details
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatCurrencyUsd(detail.quote.totalUsd)}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Issued {formatMonthDay(detail.quote.issuedAt)} and expires{" "}
                    {formatLongDate(detail.quote.expiresAt)}.
                  </p>
                </div>
                <StatusBadge status={detail.quote.status} />
              </div>

              <div className="mt-6 space-y-3">
                {detail.quote.lineItems.map((lineItem) => (
                  <div
                    className="flex items-start justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-4"
                    key={lineItem.id}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{lineItem.label}</p>
                      <p className="mt-1 text-sm text-gray-600">{lineItem.description}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrencyUsd(lineItem.amountUsd)}
                    </p>
                  </div>
                ))}
              </div>

              {detail.quote.notes ? (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Estimator note:</span>{" "}
                  {detail.quote.notes}
                </div>
              ) : null}

              <div className="mt-6">
                <QuoteActionPanel
                  quotationId={detail.quote.id}
                  requestId={request.id}
                  initialStatus={detail.quote.status}
                  slots={detail.quote.suggestedSlots}
                  title={request.title}
                  currentScheduleLabel={currentSchedule}
                  rejectionHistory={detail.quote.rejectionHistory}
                />
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link href={`/user/services/${request.id}/quotation`}>
                    Open dedicated quotation page
                  </Link>
                </Button>
              </div>
            </section>
          ) : null}

          {serviceOrder ? (
            <section className="rounded-3xl border border-teal-100 bg-teal-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Service Order Created
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">
                {serviceOrder.id}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                The accepted quotation has moved into the customer order flow.
              </p>
              <Button asChild className="mt-5">
                <Link href={`/user/orders/${serviceOrder.id}`}>View Service Order</Link>
              </Button>
            </section>
          ) : request.status === "accepted" ? (
            <section className="rounded-3xl border border-teal-100 bg-teal-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Request Accepted
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-primary">
                Quotation in preparation
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Our team accepted the request and is preparing your quotation.
              </p>
            </section>
          ) : null}

          {detail.completionSummary ? (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" size={22} />
                <h2 className="text-xl font-semibold text-gray-900">Completion summary</h2>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Completed on {formatLongDate(detail.completionSummary.completedAt)}.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-gray-700">
                {detail.completionSummary.workPerformed.map((item) => (
                  <li className="rounded-2xl bg-gray-50 px-4 py-3" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                {detail.completionSummary.followUp}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          {detail.appointment ? (
            <section
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              id="appointment"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="text-teal-700" size={22} />
                <h2 className="text-xl font-semibold text-gray-900">Appointment details</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {detail.appointment.arrivalWindowLabel}
              </p>

              <div className="mt-5 space-y-3">
                {detail.appointment.preparationChecklist.map((item) => (
                  <div className="rounded-2xl border border-gray-200 px-4 py-3 text-sm" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {technician ? (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                    Assigned technician
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-gray-900">
                    {technician.displayName}
                  </h2>
                </div>
                <ShieldCheck className="text-teal-700" size={22} />
              </div>

              <div className="mt-5 space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone size={16} />
                  {technician.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="fill-current text-amber-500" size={16} />
                  {technician.rating} rating across {technician.completedJobs} jobs
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  {technician.specializations.join(" · ")}
                </div>
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Support actions</h2>
            </div>
            <div className="mt-5 space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/contact">Message support</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/user/notifications">Review notifications</Link>
              </Button>
              {detail.completionSummary ? (
                <Button asChild className="w-full">
                  <Link href="/user/reviews">Leave or edit review</Link>
                </Button>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
